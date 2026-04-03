import { getAllSamples } from "@/lib/database/actions/sample.actions";
import { getSampleSettings } from "@/lib/database/actions/admin/products/samples.actions";
import SamplesClient from "@/components/admin/dashboard/samples/SamplesClient";

export default async function SamplesPage() {
  const [samples, settings] = await Promise.all([
    getAllSamples(),
    getSampleSettings()
  ]);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <SamplesClient initialData={samples || []} initialSettings={settings} />
    </div>
  );
}
