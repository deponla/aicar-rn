import { getLegalDocuments, getLegalDocument } from "@/api/get";
import { useQuery } from "@tanstack/react-query";

export enum LegalQueryKeys {
  LEGAL_DOCUMENTS = "legal-documents",
  LEGAL_DOCUMENT = "legal-document",
}

export const useGetLegalDocuments = () => {
  return useQuery({
    queryKey: [LegalQueryKeys.LEGAL_DOCUMENTS],
    queryFn: getLegalDocuments,
  });
};

export const useGetLegalDocument = (type: string, { enabled = true } = {}) => {
  return useQuery({
    queryKey: [LegalQueryKeys.LEGAL_DOCUMENT, type],
    queryFn: () => getLegalDocument(type),
    enabled,
  });
};
