import DynamicFormRHF from "@/components/forms/DynamicFormRHF";

export default async function FormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="p-4 sm:p-6">
      <DynamicFormRHF slug={slug} />
    </div>
  );
}
