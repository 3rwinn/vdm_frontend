// Use `||` (not `??`) so an empty-string env var (e.g. Dockerfile ARG
// declared but Build Arg missing in Dokploy) falls back to the dev URL
// instead of producing relative `fetch("/register/")` calls.
const ENV_API_URL = (import.meta.env.VITE_API_URL ?? "").trim();
export const API_BASE_URL = ENV_API_URL || "http://localhost:8000/api";

if (typeof window !== "undefined") {
  // Surface the resolved base URL once on boot — makes "why is it calling
  // app.vdmci.com instead of api.vdmci.com" trivially diagnosable in DevTools.
  // eslint-disable-next-line no-console
  console.info("[api] base URL:", API_BASE_URL);
}

type RequestOptions = RequestInit & { parseJson?: boolean; token?: string };

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { parseJson = true, headers, token, ...rest } = options;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...headers,
    },
    ...rest,
  });

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const data = await response.json();
      errorMessage = data?.error || data?.message || JSON.stringify(data);
    } catch {
      // ignore json errors
    }
    throw new Error(errorMessage || "Une erreur est survenue");
  }

  if (!parseJson) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
}

export interface VerifyPayload {
  email: string;
  code: string;
}

export interface VerifyResponse {
  refresh: string;
  access: string;
  user_data: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
}

export function registerUser(payload: RegisterPayload) {
  return request<{ message: string }>("/register/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function requestValidationCode(email: string) {
  return request<{ message: string }>("/request-code/", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function verifyValidationCode(payload: VerifyPayload) {
  return request<VerifyResponse>("/verify-code/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface ProfileResponse {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export function fetchProfile(token: string) {
  return request<ProfileResponse>("/profile/", { token });
}

export function updateProfile(
  payload: { first_name?: string; last_name?: string },
  token: string
) {
  return request<ProfileResponse>("/profile/", {
    method: "PATCH",
    body: JSON.stringify(payload),
    token,
  });
}

export interface ProductResponse {
  id: number;
  name: string;
  features: string;
  price: string;
  code?: string | null;
}

export function fetchProducts() {
  return request<ProductResponse[]>("/products/");
}

export interface WorkspaceMemberResponse {
  id: number;
  role: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface InvitationUserSummary {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface WorkspaceInvitationResponse {
  id: number;
  email: string;
  role: string;
  status: string;
  token: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  expires_at: string;
  accepted_at: string | null;
  cancelled_at: string | null;
  invited_by: InvitationUserSummary | null;
}

export interface WorkspaceResponse {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  owner: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  } | null;
  members: WorkspaceMemberResponse[];
  invitations: WorkspaceInvitationResponse[];
  products: unknown[];
  products_details: ProductResponse[];
  type_client: string | null;
  sector_activity: string | null;
  id_client: string | null;
  paystack_subscription_plan: string | null;
  paystack_subscription_status: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  is_active: boolean;
}

export interface CreateWorkspacePayload {
  name: string;
  type_client: string;
  sector_activity: string;
  id_client: string;
  plan: string;
  paystack_reference: string;
  products: Array<number | string | Record<string, unknown>>;
}

export function fetchWorkspaces(token: string) {
  return request<WorkspaceResponse[]>("/workspaces/", {
    token,
  });
}

export function createWorkspace(
  payload: CreateWorkspacePayload,
  token: string
) {
  return request<WorkspaceResponse>("/workspaces/", {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  });
}

export function deleteWorkspace(workspaceId: number, token: string) {
  return request<undefined>(`/workspaces/${workspaceId}/`, {
    method: "DELETE",
    parseJson: false,
    token,
  });
}

export interface UpdateWorkspacePayload {
  name?: string;
  type_client?: string;
  sector_activity?: string;
  id_client?: string;
  products?: Array<number | string | Record<string, unknown>>;
}

export function updateWorkspace(
  workspaceId: number,
  payload: UpdateWorkspacePayload,
  token: string
) {
  return request<WorkspaceResponse>(`/workspaces/${workspaceId}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    token,
  });
}

export interface WorkspaceMemberPayload {
  email: string;
  role: string;
}

export function inviteWorkspaceMember(
  workspaceId: number,
  payload: WorkspaceMemberPayload,
  token: string
) {
  return request<WorkspaceMemberResponse | WorkspaceInvitationResponse>(
    `/workspaces/${workspaceId}/invitations/`,
    {
      method: "POST",
      body: JSON.stringify(payload),
      token,
    }
  );
}

export function resendWorkspaceInvitation(
  workspaceId: number,
  invitationId: number,
  token: string
) {
  return request<WorkspaceInvitationResponse>(
    `/workspaces/${workspaceId}/invitations/${invitationId}/resend/`,
    {
      method: "POST",
      token,
    }
  );
}

export function cancelWorkspaceInvitation(
  workspaceId: number,
  invitationId: number,
  token: string
) {
  return request<WorkspaceInvitationResponse>(
    `/workspaces/${workspaceId}/invitations/${invitationId}/cancel/`,
    {
      method: "POST",
      token,
    }
  );
}

export function removeWorkspaceMember(
  workspaceId: number,
  memberId: number,
  token: string
) {
  return request<void>(`/workspaces/${workspaceId}/members/${memberId}/`, {
    method: "DELETE",
    parseJson: false,
    token,
  });
}

export interface InvitationDetailResponse extends WorkspaceInvitationResponse {
  workspace: {
    id: number;
    name: string;
  };
}

export function fetchInvitationDetail(token: string) {
  return request<InvitationDetailResponse>(`/invitations/${token}/`);
}

export interface AcceptInvitationPayload {
  first_name: string;
  last_name: string;
  password: string;
}

export interface AcceptInvitationResponse {
  message: string;
  workspace_id: number;
  access: string;
  refresh: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
}

export function acceptInvitation(token: string, payload: AcceptInvitationPayload) {
  return request<AcceptInvitationResponse>(`/invitations/${token}/accept/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface SectorResponse {
  sectors: string[];
}

export function fetchSectors(token: string) {
  return request<SectorResponse>("/sectors/", { token });
}

export interface ChainsResponse {
  chaines: string[];
}

export function fetchChainsBySector(sector: string, token: string) {
  return request<ChainsResponse>(`/chaines/${encodeURIComponent(sector)}`, {
    token,
  });
}

export interface BrandsResponse {
  marques: string[];
}

export function fetchBrandsBySector(sector: string, token: string) {
  return request<BrandsResponse>(`/marques/${encodeURIComponent(sector)}`, {
    token,
  });
}

export interface DdaResponse {
  success?: boolean;
  datas?: unknown;
  [key: string]: unknown;
}

export function fetchDeepDiveAnalysis(
  mode: string | null,
  sector: string,
  channel: string,
  dateFrom: string,
  dateTo: string,
) {
  const path = `/dda/${mode}/${encodeURIComponent(sector)}/${encodeURIComponent(
    channel
  )}/${encodeURIComponent(dateFrom)}/${encodeURIComponent(dateTo)}`;
  return request<DdaResponse>(path, { method: "GET" });
}

export interface MepValueEntry {
  marque: string;
  value: number | string;
}

export interface MepMetricsEntry {
  duree_commerciale: string;
  nb_spots: number;
  valorisation: string;
}

export interface MepHourlyEntry {
  annonceur: MepMetricsEntry;
  global: MepMetricsEntry;
}

export interface MepAnalysisResponse {
  success: boolean;
  mep_analysis: {
    annonceur: MepMetricsEntry;
    concurrence: MepMetricsEntry;
    classement_produit: {
      global: {
        top_20_spots: MepValueEntry[];
        top_20_valorisation: MepValueEntry[];
        top_20_duration: MepValueEntry[];
      };
      specific: {
        top_20_spots: MepValueEntry[];
        top_20_valorisation: MepValueEntry[];
        top_20_duration: MepValueEntry[];
      };
    };
    hourly_data: Record<string, MepHourlyEntry>;
    days_data: Record<string, MepHourlyEntry>;
    channels_breakdown: Array<{
      chaine: string;
      nb_spots: number;
      valorisation: string | number;
      duree_commerciale: string;
    }>;
  };
}

export function fetchMepAnalysis(
  annonceur: string,
  dateFrom: string,
  dateTo: string
) {
  const path = `/datas/anonceur/${encodeURIComponent(annonceur)}/${encodeURIComponent(
    dateFrom
  )}/${encodeURIComponent(dateTo)}`;
  return request<MepAnalysisResponse>(path, { method: "GET" });
}

export interface MemChannelEntry {
  chaine: string;
  nb_spots: number;
  valorisation: string;
  duree_commerciale: string;
}

export interface MemRankingEntry {
  value: number | string;
  [key: string]: string | number;
}

export interface MemHourlyEntry {
  nb_spots: number;
  valorisation: string;
  duree_commerciale: string;
}

export interface MemAnalysisResponse {
  global: {
    nb_spots: number;
    valorisation: string;
    duree_commerciale: string;
  };
  chains: MemChannelEntry[];
  classement_annonceurs: {
    top_spots: Array<{ annonceur: string; value: number | string }>;
    top_valorisation: Array<{ annonceur: string; value: number | string }>;
    top_duree: Array<{ annonceur: string; value: number | string }>;
  };
  classement_secteurs: {
    top_spots: Array<{ secteur: string; value: number | string }>;
    top_valorisation: Array<{ secteur: string; value: number | string }>;
    top_duree: Array<{ secteur: string; value: number | string }>;
  };
  hourly_data: Record<string, MemHourlyEntry>;
  weekly_data: Record<
    string,
    {
      nb_spots: number;
      valorisation: string;
    }
  >;
  monthly_data: Array<{
    mois: string;
    nb_spots: number;
    valorisation: string;
  }>;
}

export interface CleanDataRecord {
  id: number;
  chaine: string | null;
  secteur_activite: string | null;
  annonceur: string | null;
  marque: string | null;
  titre: string | null;
  station_type: string | null;
  date_debut: string;
  date_fin: string;
  date: string;
  heure: number | null;
  duration: string | null;
  duree_seconds: number | string | null;
  day_of_week: number | null;
  valorization: number | string | null;
}

export interface CleanDataResponse {
  datas: CleanDataRecord[];
}

export interface ReportsQueryParams {
  sector?: string;
  channel?: string;
  advertiser?: string;
  marque?: string;
  stationType?: string;
  search?: string;
  from?: string;
  to?: string;
  dayOfWeek?: string;
  hour?: string;
}

function buildReportsQueryString(filters: ReportsQueryParams) {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.sector) params.set("sector", filters.sector);
  if (filters.channel) params.set("channel", filters.channel);
  if (filters.advertiser) params.set("advertiser", filters.advertiser);
  if (filters.marque) params.set("marque", filters.marque);
  if (filters.stationType) params.set("station_type", filters.stationType);
  if (filters.search) params.set("search", filters.search);
  if (filters.dayOfWeek) params.set("day_of_week", filters.dayOfWeek);
  if (filters.hour) params.set("hour", filters.hour);
  return params.toString();
}

export function fetchReportsData(
  productCode: string | null,
  filters: ReportsQueryParams,
  token?: string
) {
  if (!productCode) {
    throw new Error("Aucun produit sélectionné pour ce workspace.");
  }

  const queryString = buildReportsQueryString(filters);
  const suffix = queryString ? `?${queryString}` : "";

  if (productCode === "metv" || productCode === "mer") {
    const sector = filters.sector?.trim();
    const channel = filters.channel?.trim();
    if (!sector || !channel) {
      throw new Error("Veuillez préciser le secteur et la chaîne suivie.");
    }
    const path = `/datas/chaine/${encodeURIComponent(channel)}/sector/${encodeURIComponent(
      sector
    )}${suffix}`;
    return request<CleanDataResponse>(path, { token });
  }

  if (productCode === "mep") {
    const sector = filters.sector?.trim();
    const advertiser = filters.advertiser?.trim();
    if (!sector || !advertiser) {
      throw new Error("Veuillez préciser le secteur et l'annonceur suivi.");
    }
    const path = `/datas/annonceur/${encodeURIComponent(
      advertiser
    )}/sector/${encodeURIComponent(sector)}${suffix}`;
    return request<CleanDataResponse>(path, { token });
  }

  if (productCode === "mem") {
    const path = `/datas/all/${suffix}`;
    return request<CleanDataResponse>(path, { token });
  }

  throw new Error("Produit non pris en charge pour les rapports.");
}

export function fetchMemAnalysis(dateFrom?: string, dateTo?: string) {
  const params = new URLSearchParams();
  if (dateFrom) params.set("from", dateFrom);
  if (dateTo) params.set("to", dateTo);
  const query = params.toString();
  const path = query ? `/mem/?${query}` : "/mem/";
  return request<MemAnalysisResponse>(path, { method: "GET" });
}

export interface SimulationRequest {
  advertiser: string;
  investmentAmount: number;
  advertisementDuration: number;
  dateFrom: string;
  dateTo: string;
}

export interface SimulationChannelAllocation {
  suggested_investment: number;
  optimal_time_slots: string[];
  impact_level: string;
  estimated_spots: number;
  avg_duration: number;
  avg_cost_per_spot: number;
  current_share: string;
}

export interface SimulationRecommendations {
  is_new_advertiser: boolean;
  sector: string | null;
  channel_allocation: Record<string, SimulationChannelAllocation>;
  total_budget: number;
  duration: number;
  campaign_period: {
    start: string;
    end: string;
    total_days: number;
  };
}

export interface SimulationResponsePayload {
  success: boolean;
  recommendations: SimulationRecommendations;
}

export function runSimulation(
  { advertiser, investmentAmount, advertisementDuration, dateFrom, dateTo }: SimulationRequest,
  token: string
) {
  const roundedInvestment = Math.round(investmentAmount)
  const roundedDuration = Math.round(advertisementDuration)
  const path = `/recommendation/${encodeURIComponent(advertiser)}/${encodeURIComponent(
    roundedInvestment
  )}/${encodeURIComponent(roundedDuration)}/${encodeURIComponent(dateFrom)}/${encodeURIComponent(dateTo)}`;
  return request<SimulationResponsePayload>(path, { token });
}

export type PigeReportType = "channel" | "advertiser";

interface DownloadPigeReportParams {
  type: PigeReportType;
  sector: string;
  identifier: string;
  token?: string;
}

export async function downloadPigeReport({
  type,
  sector,
  identifier,
  token,
}: DownloadPigeReportParams): Promise<Blob> {
  let path: string;
  if (type === "channel") {
    path = `/pige/${encodeURIComponent(sector)}/${encodeURIComponent(identifier)}`;
  } else if (type === "advertiser") {
    path = `/pige/annonceur/${encodeURIComponent(sector)}/${encodeURIComponent(
      identifier
    )}`;
  } else {
    throw new Error("Type de rapport PIGE non supporté.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const data = await response.json();
      errorMessage = data?.error || data?.message || JSON.stringify(data);
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(errorMessage || "Impossible de générer le rapport PIGE.");
  }

  return response.blob();
}


// ---------------------------------------------------------------------------
// Pige Schedule (programmation d'envoi par email)
// ---------------------------------------------------------------------------

export interface PigeSchedule {
  id: number;
  workspace: number;
  report_type: "channel" | "advertiser";
  sector: string;
  identifier: string;
  frequency: "monthly" | "quarterly" | "yearly";
  recipients: string[];
  is_active: boolean;
  last_sent_at: string | null;
  next_run_at: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePigeSchedulePayload {
  frequency: "monthly" | "quarterly" | "yearly";
  recipients: string[];
}

export function fetchPigeSchedules(
  workspaceId: number,
  token?: string
): Promise<PigeSchedule[]> {
  return request<PigeSchedule[]>(
    `/workspaces/${workspaceId}/pige-schedules/`,
    { token }
  );
}

export function createPigeSchedule(
  workspaceId: number,
  payload: CreatePigeSchedulePayload,
  token?: string
): Promise<PigeSchedule> {
  return request<PigeSchedule>(
    `/workspaces/${workspaceId}/pige-schedules/`,
    { method: "POST", body: JSON.stringify(payload), token }
  );
}

export function updatePigeSchedule(
  workspaceId: number,
  scheduleId: number,
  payload: Partial<CreatePigeSchedulePayload & { is_active: boolean }>,
  token?: string
): Promise<PigeSchedule> {
  return request<PigeSchedule>(
    `/workspaces/${workspaceId}/pige-schedules/${scheduleId}/`,
    { method: "PATCH", body: JSON.stringify(payload), token }
  );
}

export function deletePigeSchedule(
  workspaceId: number,
  scheduleId: number,
  token?: string
): Promise<void> {
  return request<void>(
    `/workspaces/${workspaceId}/pige-schedules/${scheduleId}/`,
    { method: "DELETE", parseJson: false, token }
  );
}

export function sendPigeTestEmail(
  workspaceId: number,
  recipients: string[],
  token?: string
): Promise<{ message: string }> {
  return request<{ message: string }>(
    `/workspaces/${workspaceId}/pige-schedules/test-email/`,
    { method: "POST", body: JSON.stringify({ recipients }), token }
  );
}
