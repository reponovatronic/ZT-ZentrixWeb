import type { AdminDashboardMetrics } from "@/domain/entities/admin_dashboard_metrics";
import type {
  AdminDashboardMetricsRepository,
  FetchAdminDashboardMetricsParams,
} from "@/domain/repositories/admin_dashboard_metrics_repository";
import { getAdminDashboardMetricsJson } from "@/data/http/admin_dashboard_metrics_client";
import { isPortalAdminApiMode } from "@/data/http/portal_api_mode";
import { getPartnerDashboardMetricsJson } from "@/data/http/partner_dashboard_metrics_client";
import { adminDashboardMetricsFromJson } from "@/presentation/mappers/admin_dashboard_metrics_mapper";

export class AdminDashboardMetricsRepositoryImpl implements AdminDashboardMetricsRepository {
  async fetchMetrics(params: FetchAdminDashboardMetricsParams): Promise<AdminDashboardMetrics> {
  let j: Record<string, unknown>;

  if (isPortalAdminApiMode()) {
    const partnerId = params.partnerId;

    if (
      partnerId == null ||
      !Number.isSafeInteger(partnerId) ||
      partnerId <= 0
    ) {
      throw new Error("El identificador del socio no es válido.");
    }

    j = await getAdminDashboardMetricsJson(
      {
        partnerId,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      },
      params.signal
    );
  } else {
    j = await getPartnerDashboardMetricsJson(
      {
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      },
      params.signal
    );
  }

  return adminDashboardMetricsFromJson(j);
}
}
