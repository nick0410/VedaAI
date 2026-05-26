import { AppShell } from '@/components/AppShell';
import { CreateAssignmentForm } from '@/components/CreateAssignmentForm';

export default function CreatePage() {
  return (
    <AppShell
      title="Create Assignment"
      subtitle="Set up your AI-generated assessment"
      backHref="/"
    >
      <div className="max-w-3xl mx-auto">
        <CreateAssignmentForm />
      </div>
    </AppShell>
  );
}
