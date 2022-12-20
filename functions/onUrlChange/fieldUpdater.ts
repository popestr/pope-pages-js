const YEXT_API_KEY = "a21320fcc902e963317958ff4f9ca77b";
const API_BASE = "https://api.yext.com/v2/accounts/me/";
const VER = "20210714";
const FIELD_KEY = "c_pagesURL";

export interface WritebackPayload {
  url: string;
  entityId: string;
  locale: string;
  feature: string;
}

// TODO: Once JS config supports FunctionSelector, rename this and reference in feature
export async function main(data: WritebackPayload) {
  if (!data.entityId || !data.locale) {
    return null;
  }

  // TODO: Once JS config supports FunctionSelector, remove this and select the function there
  if (data.feature != "sports") {
    return null;
  }

  const result = await writebackUrl(data);
  return result;
}

async function writebackUrl(data: WritebackPayload) {
  const updateField = {"meta": {"language": data.locale}}
  updateField[FIELD_KEY] = data.url
  let result = await updateEntity(data.entityId, updateField)
  return result
}

async function updateEntity<T extends EntityProfile>(
  id: string,
  body: EntityProfile,
): Promise<T> {
  const req = new Request(buildApiUrl(`entities/${id}`), {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
  const response = await fetch(req);
  if (response.status < 200 || response.status >= 300) {
    const responseBody = await response.json() as ApiResponse<T>;
    throw responseBody.meta.errors[0].message
  }
  const responseBody = await response.json() as ApiResponse<T>;
  return responseBody.response;
}

function buildApiUrl(path: string, params?: Record<string, string>) {
  const result = new URL(path, API_BASE);
  result.searchParams.append("api_key", YEXT_API_KEY);
  result.searchParams.append("v", VER);
  for (const k in params) {
    result.searchParams.append(k, params[k]);
  }
  return result.toString();
}

interface EntityProfile {
  [field: string]: ProfileValue;

  meta?: {
    accountId: string;
    uid: string;
    id: string;
    timestamp: string;
    folderId: string;
    language: string;
    countryCode: string;
    entityType: string;
  };

  name?: string;
}

type ProfileValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ProfileValue[]
  | { [k: string]: ProfileValue };

interface ApiResponse<T> {
  meta: {
    uuid: string;
    errors: {
      code: number;
      message: string;
      type: string;
    }[];
  };
  response: T;
}