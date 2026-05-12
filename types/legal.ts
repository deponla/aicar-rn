export enum LegalDocumentTypeEnum {
  TERMS_AND_RULES = "terms-and-rules",
  ACCOUNT_AGREEMENT = "account-agreement",
  TERMS_OF_USE = "terms-of-use",
  PRIVACY_POLICY = "privacy-policy",
  KVKK_DISCLOSURE = "kvkk-disclosure",
  COOKIE_POLICY = "cookie-policy",
  HELP_GUIDE = "help-guide",
}

export interface LegalDocument {
  id: string;
  type: LegalDocumentTypeEnum;
  language: string;
  title: string;
  content: string;
  version: string;
  effectiveDate: string;
  excerpt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LegalDocumentResponse {
  result: LegalDocument;
}
