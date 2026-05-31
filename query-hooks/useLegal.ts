import { getLegalDocuments } from "@/api/get";
import { normalizeLanguage } from "@/i18n";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

enum LegalQueryKeys {
  LEGAL_DOCUMENTS = "legal-documents",
}

export const useGetLegalDocuments = () => {
  const { i18n } = useTranslation();
  const language = normalizeLanguage(i18n.resolvedLanguage || i18n.language);

  return useQuery({
    queryKey: [LegalQueryKeys.LEGAL_DOCUMENTS, language],
    queryFn: () => getLegalDocuments({ language }),
  });
};
