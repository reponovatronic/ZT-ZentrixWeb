import {
  deletePartnerProduct,
  fetchMyProducts,
  setProductListingActive,
} from "@/data/http/partner_products_client";
import type { PartnerProductListRow } from "@/domain/entities/partner_product";
import { AdminPartnerViewBanner } from "@/presentation/components/partners/admin_partner_view_banner";
import { PartnerPanelHeaderTools } from "@/presentation/components/partners/partner_panel_header_tools";
import { PartnerProductDeleteConfirmModal } from "@/presentation/components/partners/partner_product_delete_confirm_modal";
import { PartnerProductFormModal } from "@/presentation/components/partners/partner_product_form_modal";
import { usePartnersPortalRedirects } from "@/presentation/hooks/use_partners_portal_redirects";
import { usePartnerPortalNavWhitelist } from "@/presentation/hooks/use_partner_portal_nav_whitelist";
import { useEffectivePortalPartnerId } from "@/presentation/hooks/use_effective_portal_partner_id";
import { usePartnerDashboardFilters } from "@/presentation/hooks/use_partner_dashboard_filters";
import {
  PartnerProductsMainPane,
  type ProductStatusFilter,
} from "@/presentation/components/partners/partner_products_main_pane";
import { useAdminPartnerViewStore } from "@/presentation/stores/admin_partner_view_store";
import { usePartnerSessionStore } from "@/presentation/stores/partner_session_store";
import {
  isAdminPartnerImpersonationActive,
} from "@/presentation/utils/admin_partner_session_scope";
import {
  partnerInitialsPartner,
  isPartnerAdminRole,
  partnerPhotoSrc,
} from "@/presentation/utils/partner_display_utils";
import { PartnerDashboard } from "@happy-bags/partner-dashboard";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "@/presentation/styles/partners_products.css";
//
const MOCK_PARTNER_PRODUCTS: PartnerProductListRow[] = [
  {
    id: "mock-prod-001",
    name: "Sorpresa italiana",
    description: "Selección de productos italianos para disfrutar.",
    imageUrl: "",
    scheduleLabel: "Lun - Vie · 18:00 a 21:00",
    isActive: true,
    offerPriceLabel: "S/ 18.00",
    originalPriceLabel: "S/ 30.00",
    discountLabel: "-40%",
    stockCount: 15,
    categoryApiId: 2,
  },
  {
    id: "mock-prod-002",
    name: "Caja mixta sorpresa",
    description: "Una combinación especial de productos variados.",
    imageUrl: "",
    scheduleLabel: "Todos los días · 12:00 a 20:00",
    isActive: true,
    offerPriceLabel: "S/ 24.00",
    originalPriceLabel: "S/ 40.00",
    discountLabel: "-40%",
    stockCount: 22,
    categoryApiId: 8,
  },
  {
    id: "mock-prod-003",
    name: "Sorpresa japonesa",
    description: "Productos japoneses seleccionados para ti.",
    imageUrl: "",
    scheduleLabel: "Lun - Sáb · 17:00 a 20:00",
    isActive: true,
    offerPriceLabel: "S/ 24.00",
    originalPriceLabel: "S/ 36.00",
    discountLabel: "-33%",
    stockCount: 8,
    categoryApiId: 1,
  },
  {
    id: "mock-prod-004",
    name: "Caja premium",
    description: "Una selección premium de productos del día.",
    imageUrl: "",
    scheduleLabel: "Todos los días · 10:00 a 18:00",
    isActive: false,
    offerPriceLabel: "S/ 35.00",
    originalPriceLabel: "S/ 50.00",
    discountLabel: "-30%",
    stockCount: 12,
    categoryApiId: 8,
  },
  {
    id: "mock-prod-005",
    name: "Pack de postres",
    description: "Variedad de postres preparados en el día.",
    imageUrl: "",
    scheduleLabel: "Mar - Dom · 15:00 a 19:00",
    isActive: true,
    offerPriceLabel: "S/ 16.00",
    originalPriceLabel: "S/ 25.00",
    discountLabel: "-36%",
    stockCount: 5,
    categoryApiId: 5,
  },
  {
    id: "mock-prod-006",
    name: "Pack de hamburguesas",
    description: "Productos preparados para disfrutar en casa.",
    imageUrl: "",
    scheduleLabel: "Todos los días · 19:00 a 22:00",
    isActive: false,
    offerPriceLabel: "S/ 28.00",
    originalPriceLabel: "S/ 40.00",
    discountLabel: "-30%",
    stockCount: 18,
    categoryApiId: 3,
  },
];
//
export function PartnersProductsPage() {
  const navigate = useNavigate();
  usePartnersPortalRedirects({ requireAdminImpersonation: true });
  const status = usePartnerSessionStore((s) => s.status);
  const partner = usePartnerSessionStore((s) => s.partner);
  const signOut = usePartnerSessionStore((s) => s.signOut);
  const viewedPartnerId = useAdminPartnerViewStore((s) => s.viewedPartnerId);
  const scopedToPortalUserId = useAdminPartnerViewStore((s) => s.scopedToPortalUserId);
  const effectivePartnerId = useEffectivePortalPartnerId();
  const navWhitelist = usePartnerPortalNavWhitelist();

  const [items, setItems] = useState<PartnerProductListRow[]>([]);
  const [mockProducts, setMockProducts] = useState<PartnerProductListRow[]>(
  MOCK_PARTNER_PRODUCTS
  );
  const [editingProduct, setEditingProduct] =
  useState<PartnerProductListRow | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PartnerProductListRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryApiIdHint, setCategoryApiIdHint] = useState<number | null>(null);
  const periodFilter = usePartnerDashboardFilters();

  const listAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 400);
    return () => window.clearTimeout(t);
  }, [search]);

  /** Productos sólo rol socio; admin con vista de socio no debe ver este módulo. */
  useEffect(() => {
    if (status === "loading" || !partner) return;
    if (
      isPartnerAdminRole(partner.role) &&
      isAdminPartnerImpersonationActive(
        partner,
        viewedPartnerId,
        scopedToPortalUserId
      )
    ) {
      navigate("/partners/panel", { replace: true });
    }
  }, [
    status,
    partner,
    navigate,
    viewedPartnerId,
    scopedToPortalUserId,
  ]);

  const loadProducts = useCallback(async () => {
  listAbortRef.current?.abort();

  setListLoading(true);
  setListError(null);

  // DEV: cargar productos mock sin consultar la API.
  // DEV: cargar productos mock sin consultar la API.
if (import.meta.env.DEV) {
  const normalizedSearch = debouncedSearch.trim().toLowerCase();

  const filteredProducts = mockProducts.filter((product) => {
    const matchesSearch =
      !normalizedSearch ||
      product.name.toLowerCase().includes(normalizedSearch) ||
      product.description.toLowerCase().includes(normalizedSearch);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && product.isActive) ||
      (statusFilter === "inactive" && !product.isActive);

    return matchesSearch && matchesStatus;
  });

  setItems(filteredProducts);
  setListLoading(false);
  return;
}

  // PROD: conservar consulta real.
  const ac = new AbortController();
  listAbortRef.current = ac;

  try {
    const isActive =
      statusFilter === "all"
        ? undefined
        : statusFilter === "active"
          ? true
          : false;

    const res = await fetchMyProducts({
      search: debouncedSearch.trim() || undefined,
      isActive,
      page: 1,
      limit: 80,
      signal: ac.signal,
      scopedPartnerId: effectivePartnerId,
    });

    setItems(res.items);
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === "AbortError") return;

    setListError(
      e instanceof Error
        ? e.message
        : "No se pudieron cargar los productos."
    );

    setItems([]);
  } finally {
    setListLoading(false);
  }
}, [debouncedSearch, statusFilter, effectivePartnerId, mockProducts]);

  useEffect(() => {
    if (status === "loading" || !partner) return;
    void loadProducts();
  }, [status, partner, loadProducts]);

  async function handleSignOut() {
    await signOut();
    navigate("/partners");
  }

  function navClick(id: string) {
    if (id === "dashboard") navigate("/partners/panel");
    if (id === "orders") navigate("/partners/orders");
    if (id === "products") navigate("/partners/products");
    if (id === "partners") navigate("/partners/directory");
    if (id === "metrics") navigate("/partners/metrics");
    if (id === "profile") navigate("/partners/profile");
  }

  function openCreateModal(): void {
    setEditingId(null);
    setEditingProduct(null);
    setCategoryApiIdHint(null);
    setModalOpen(true);
  }

  function openEditModal(p: PartnerProductListRow): void {
  setEditingId(p.id);
  setEditingProduct(p);
  setCategoryApiIdHint(p.categoryApiId);
  setModalOpen(true);
  }

  async function handleToggleListing(
  p: PartnerProductListRow,
  next: boolean
): Promise<void> {
  setTogglingId(p.id);

  if (import.meta.env.DEV) {
    setMockProducts((rows) =>
      rows.map((r) => (r.id === p.id ? { ...r, isActive: next } : r))
    );

    setItems((rows) =>
      rows.map((r) => (r.id === p.id ? { ...r, isActive: next } : r))
    );

    setTogglingId(null);
    return;
  }

  const prev = p.isActive;

  setItems((rows) =>
    rows.map((r) => (r.id === p.id ? { ...r, isActive: next } : r))
  );

  try {
    await setProductListingActive(
      p.id,
      next,
      undefined,
      effectivePartnerId
    );
  } catch (e: unknown) {
    setItems((rows) =>
      rows.map((r) => (r.id === p.id ? { ...r, isActive: prev } : r))
    );

    window.alert(
      e instanceof Error
        ? e.message
        : "No se pudo actualizar el estado."
    );
  } finally {
    setTogglingId(null);
  }
}

  function requestDelete(p: PartnerProductListRow): void {
    setDeleteError(null);
    setDeleteTarget(p);
  }

  function closeDeleteDialog(): void {
    if (deletingId) return;
    setDeleteTarget(null);
    setDeleteError(null);
  }

  async function confirmDelete(): Promise<void> {
  if (!deleteTarget) return;

  const productId = deleteTarget.id;

  setDeletingId(productId);
  setDeleteError(null);

  // DEV: eliminar del catálogo mock sin consultar la API.
  if (import.meta.env.DEV) {
    setMockProducts((rows) =>
      rows.filter((r) => r.id !== productId)
    );

    setItems((rows) =>
      rows.filter((r) => r.id !== productId)
    );

    setDeleteTarget(null);
    setDeletingId(null);
    return;
  }

  // PROD: conservar eliminación mediante API.
  try {
    await deletePartnerProduct(
      productId,
      undefined,
      effectivePartnerId
    );

    setItems((rows) =>
      rows.filter((r) => r.id !== productId)
    );

    setDeleteTarget(null);
  } catch (e: unknown) {
    setDeleteError(
      e instanceof Error
        ? e.message
        : "No se pudo eliminar el producto."
    );
  } finally {
    setDeletingId(null);
  }
}

  if (status === "loading" || !partner) {
    return (
      <div className="pd-panel-loading">
        <p>Cargando…</p>
      </div>
    );
  }

  return (
    <>
      <PartnerDashboard
        partnerName={partner.displayName}
        partnerTag="Socio Happy Bag"
        partnerInitial={partnerInitialsPartner(partner)}
        partnerPhotoSrc={partnerPhotoSrc(partner)}
        partnerRole={partner.role}
        navItemWhitelist={navWhitelist ? [...navWhitelist] : null}
        floatingNotice={<AdminPartnerViewBanner />}
        onSignOut={handleSignOut}
        pageTitle="Mis productos"
        activeNavId="products"
        headerTools={
          <PartnerPanelHeaderTools
            presetId={periodFilter.presetId}
            onPresetChange={periodFilter.setPresetId}
            customRange={periodFilter.customRange}
            onCustomRangeChange={periodFilter.setCustomRange}
          />
        }
        mainPane={
          <PartnerProductsMainPane
            items={items}
            loading={listLoading}
            listError={listError}
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            togglingId={togglingId}
            deletingId={deletingId}
            onToggleListing={handleToggleListing}
            onEdit={openEditModal}
            onDelete={requestDelete}
            catalogLooksEmpty={debouncedSearch.trim() === "" && statusFilter === "all"}
            onAddProduct={openCreateModal}
          />
        }
        onNavItemClick={navClick}
      />

      <PartnerProductFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingId(null);
          setEditingProduct(null);
        }}
        editingProductId={editingId}
        editingProduct={editingProduct}
        categoryApiIdHint={categoryApiIdHint}
        scopedPartnerId={effectivePartnerId}
        onSaved={(savedProduct) => {
  // DEV: actualizar el catálogo mock y el listado visible.
  if (import.meta.env.DEV && savedProduct) {
    setMockProducts((rows) => {
      const exists = rows.some(
        (row) => row.id === savedProduct.id
      );

      if (exists) {
        return rows.map((row) =>
          row.id === savedProduct.id ? savedProduct : row
        );
      }

      return [savedProduct, ...rows];
    });

    setItems((rows) => {
      const exists = rows.some(
        (row) => row.id === savedProduct.id
      );

      const updatedRows = exists
        ? rows.map((row) =>
            row.id === savedProduct.id ? savedProduct : row
          )
        : [savedProduct, ...rows];

      const normalizedSearch = debouncedSearch.trim().toLowerCase();

      return updatedRows.filter((product) => {
        const matchesSearch =
          !normalizedSearch ||
          product.name.toLowerCase().includes(normalizedSearch) ||
          product.description.toLowerCase().includes(normalizedSearch);

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && product.isActive) ||
          (statusFilter === "inactive" && !product.isActive);

        return matchesSearch && matchesStatus;
      });
    });

    return;
  }

  // PROD: volver a consultar el listado real.
  void loadProducts();
}}
      />

      <PartnerProductDeleteConfirmModal
        open={deleteTarget != null}
        product={deleteTarget}
        deleting={deletingId != null}
        error={deleteError}
        onClose={closeDeleteDialog}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
