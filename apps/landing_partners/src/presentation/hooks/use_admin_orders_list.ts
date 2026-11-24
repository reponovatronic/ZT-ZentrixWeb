
import { useCallback, useEffect, useState } from "react";
import { isSessionUnauthorizedError } from "@/data/auth/session_unauthorized_error";
import { AdminOrdersRepositoryImpl } from "@/data/repositories/admin_orders_repository_impl";
import type {
  AdminOrdersPage,
  AdminOrdersPageKpis,
  AdminOrderListItem,
} from "@/domain/entities/admin_order";
import { mapUiStatusToApiFilter } from "@/presentation/mappers/admin_orders_mapper";
import { isPortalAdminApiMode } from "@/data/http/portal_api_mode";
import { useAdminPartnerViewHydrated } from "@/presentation/hooks/use_admin_partner_view_hydrated";
import {
  resolveDashboardDateQuery,
  resolvePartnerIdQuery,
} from "@/presentation/utils/dashboard_query_utils";
import type { MetricsRangeId } from "@happy-bags/partner-dashboard";
import type { DateRange } from "@/presentation/utils/date_range_utils";
import { mockOrders } from "@happy-bags/partner-dashboard";

const ordersRepo = new AdminOrdersRepositoryImpl();

export type UseAdminOrdersListParams = {
  partnerId: string | undefined;
  presetId: MetricsRangeId;
  customRange: DateRange;
  page: number;
  limit?: number;
  statusFilter?: string;
  orderIdSearch?: string;
  refreshKey?: number;
};

const MOCK_ORDERS: AdminOrderListItem[] = mockOrders.map((order, index) => {
  const total = Number(order.total.replace(/[^\d.]/g, "")) || 0;

  const statusMap: Record<string, string> = {
    Pendiente: "PENDING_PAYMENT",
    Confirmada: "PAID",
    "Por recoger": "READY",
    Recogida: "DELIVERED",
    Cancelada: "CANCELLED",
  };

  return {
    orderId: 900000 + index,
    orderCode: order.id,
    customerName: order.customer,
    customerMasked: order.customer,
    customerInitial: order.initial,
    productLabel: order.product,
    total,
    totalDisplay: order.total,
    status: statusMap[order.status],
    statusLabel: order.status,
    pickupWindow: order.pickup,
    createdAt: new Date().toISOString(),
  };
});

function buildMockOrdersPage({
  page,
  limit,
  statusFilter,
  orderIdSearch,
}: {
  page: number;
  limit: number;
  statusFilter?: string;
  orderIdSearch?: string;
}): AdminOrdersPage {
  const normalizedSearch = orderIdSearch?.trim().toLowerCase();

  const filtered = MOCK_ORDERS.filter((order) => {
    const matchesStatus = !statusFilter || order.statusLabel === statusFilter;
    const matchesSearch =
      !normalizedSearch ||
      order.orderCode.toLowerCase().includes(normalizedSearch) ||
      order.customerMasked.toLowerCase().includes(normalizedSearch);

    return matchesStatus && matchesSearch;
  });

  const kpis: AdminOrdersPageKpis = {
    pendingPayment: MOCK_ORDERS.filter((o) => o.status === "PENDING_PAYMENT").length,
    paid: MOCK_ORDERS.filter((o) => o.status === "PAID").length,
    preparing: 0,
    ready: MOCK_ORDERS.filter((o) => o.status === "READY").length,
    delivered: MOCK_ORDERS.filter((o) => o.status === "DELIVERED").length,
    cancelled: MOCK_ORDERS.filter((o) => o.status === "CANCELLED").length,
    expired: 0,
    total: MOCK_ORDERS.length,
  };

  const start = (page - 1) * limit;

  return {
    items: filtered.slice(start, start + limit),
    total: filtered.length,
    page,
    limit,
    kpis,
  };
}

export function useAdminOrdersList({
  partnerId,
  presetId,
  customRange,
  page,
  limit = 20,
  statusFilter,
  orderIdSearch,
  refreshKey = 0,
}: UseAdminOrdersListParams) {
  const adminViewHydrated = useAdminPartnerViewHydrated();
  const [data, setData] = useState<AdminOrdersPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateQuery = resolveDashboardDateQuery(presetId, customRange);
  const apiStatus = statusFilter ? mapUiStatusToApiFilter(statusFilter) : undefined;

  const load = useCallback(
    async (signal: AbortSignal) => {
      if (import.meta.env.DEV) {
        setLoading(false);
        setError(null);
        setData(
          buildMockOrdersPage({
            page,
            limit,
            statusFilter,
            orderIdSearch,
          })
        );
        return;
      }

      const adminMode = isPortalAdminApiMode();
      if (adminMode && !adminViewHydrated) return;

      const pid = resolvePartnerIdQuery(partnerId);

      if (adminMode && !pid) {
        setData(null);
        setError("No se encontró el identificador del socio.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await ordersRepo.fetchOrders({
          partnerId: pid ?? 0,
          page,
          limit,
          status: apiStatus,
          orderId: orderIdSearch?.trim() || undefined,
          dateFrom: dateQuery.dateFrom,
          dateTo: dateQuery.dateTo,
          signal,
        });

        setData(result);
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        if (isSessionUnauthorizedError(e)) return;

        setData(null);
        setError(
          e instanceof Error
            ? e.message
            : "No se pudieron cargar las órdenes."
        );
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [
      partnerId,
      page,
      limit,
      apiStatus,
      statusFilter,
      orderIdSearch,
      dateQuery.dateFrom,
      dateQuery.dateTo,
      refreshKey,
      adminViewHydrated,
    ]
  );

  useEffect(() => {
    const ac = new AbortController();
    void load(ac.signal);
    return () => ac.abort();
  }, [load]);

  return { data, loading, error, dateQuery };
}
