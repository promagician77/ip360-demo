import { AssessmentWizard } from "@/components/AssessmentWizard";

export const metadata = { title: "Assessment" };

export default async function AssessmentPage({ searchParams }: { searchParams: Promise<{ retake?: string }> }) {
  const { retake } = await searchParams;
  return <AssessmentWizard retake={retake === "1"} />;
}
