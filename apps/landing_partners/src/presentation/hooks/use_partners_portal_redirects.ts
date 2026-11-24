
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAdminPartnerViewStore } from "@/presentation/stores/admin_partner_view_store";
import { usePartnerSessionStore } from "@/presentation/stores/partner_session_store";
import { isAdminPartnerImpersonationActive } from "@/presentation/utils/admin_partner_session_scope";
import { isPartnerAdminRole } from "@/presentation/utils/partner_display_utils";
import { useAdminPartnerViewHydrated } from "@/presentation/hooks/use_admin_partner_view_hydrated";

/**
 * Redirecciones de sesión y reglas específicas
 * de rol administrador vs socio.
 */
export function usePartnersPortalRedirects(options?: {
  /**
   * Vistas tipo panel de socio:
   * admin requiere tener un socio elegido.
   */
  requireAdminImpersonation?: boolean;

  /**
   * Solo el rol partner puede ver el perfil de socio.
   * Los administradores regresan al directorio.
   */
  blockAdminFromProfile?: boolean;
}) {
  const navigate = useNavigate();

  const status = usePartnerSessionStore((s) => s.status);
  const partner = usePartnerSessionStore((s) => s.partner);
  const refreshSession = usePartnerSessionStore((s) => s.refreshSession);

  const viewedPartnerId = useAdminPartnerViewStore(
    (s) => s.viewedPartnerId
  );

  const scopedToPortalUserId = useAdminPartnerViewStore(
    (s) => s.scopedToPortalUserId
  );

  const adminViewHydrated = useAdminPartnerViewHydrated();

  const requireAdminImpersonation =
    options?.requireAdminImpersonation === true;

  const blockAdminFromProfile =
    options?.blockAdminFromProfile === true;

  // Actualizar la sesión al montar la página en producción.
  useEffect(() => {
    if (import.meta.env.DEV) return;

    void refreshSession();
  }, [refreshSession]);

  // Aplicar las reglas de acceso y redirección.
  useEffect(() => {
    // En DEV se permite trabajar con el socio mock.
    if (import.meta.env.DEV) return;

    // Esperar a que termine la consulta inicial de sesión.
    if (status !== "ready") return;

    // Sin sesión válida, regresar al login.
    if (!partner) {
      navigate("/partners", { replace: true });
      return;
    }

    const admin = isPartnerAdminRole(partner.role);

    // El administrador no puede acceder al perfil de socio.
    if (blockAdminFromProfile && admin) {
      navigate("/partners/directory", { replace: true });
      return;
    }

    // Las vistas de socio requieren una selección activa
    // cuando el usuario autenticado es administrador.
    if (requireAdminImpersonation && admin) {
      if (!adminViewHydrated) return;

      if (
        !isAdminPartnerImpersonationActive(
          partner,
          viewedPartnerId,
          scopedToPortalUserId
        )
      ) {
        navigate("/partners/directory", { replace: true });
      }
    }
  }, [
    status,
    partner,
    navigate,
    viewedPartnerId,
    scopedToPortalUserId,
    adminViewHydrated,
    blockAdminFromProfile,
    requireAdminImpersonation,
  ]);
}
