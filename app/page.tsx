import DataTable from "@/components/DataTable";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            User Directory
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Manage and view user records fetched from the Random User API.
          </p>
        </div>

        <DataTable />
      </div>
    </main>
  );
}
