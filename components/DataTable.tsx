"use client";

import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { 
  filterUsers, 
  sortUsers, 
  paginateData, 
  type User, 
  type SortKey, 
  type SortDirection 
} from "@/utils/table-helpers";

interface APIResponse {
  results: User[];
  info: {
    seed: string;
    results: number;
    page: number;
    version: string;
  };
}

const SortIcon = memo(({ column, sortConfig }: { column: SortKey; sortConfig: { key: SortKey; direction: SortDirection } }) => {
  if (sortConfig.key !== column || !sortConfig.direction) {
    return <span className="inline-block ml-1 w-4 h-4 text-gray-300 dark:text-zinc-600">↕</span>;
  }
  return sortConfig.direction === "asc" ? (
    <span className="inline-block ml-1 w-4 h-4 text-zinc-900 dark:text-white">↑</span>
  ) : (
    <span className="inline-block ml-1 w-4 h-4 text-zinc-900 dark:text-white">↓</span>
  );
});

SortIcon.displayName = "SortIcon";

export default function DataTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "name.first",
    direction: "asc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchUsers = async () => {
      try {
        const response = await fetch("https://randomuser.me/api/?inc=gender,name,email,dob&results=40", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Failed to fetch data");
        const data: APIResponse = await response.json();
        setUsers(data.results);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();

    return () => controller.abort();
  }, []);

  const handleSort = useCallback((key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1); // Reset to first page on sort
  }, []);

  // Use extracted helpers for business logic
  const filteredUsers = useMemo(() => 
    filterUsers(users, debouncedQuery), 
  [users, debouncedQuery]);

  const sortedUsers = useMemo(() => 
    sortUsers(filteredUsers, sortConfig), 
  [filteredUsers, sortConfig]);

  const paginatedUsers = useMemo(() => 
    paginateData(sortedUsers, currentPage, pageSize), 
  [sortedUsers, currentPage]);

  const totalPages = Math.ceil(sortedUsers.length / pageSize);

  if (loading) return <div className="text-center py-20 text-gray-500 font-medium">Loading users...</div>;
  if (error) return <div className="text-center py-20 text-red-500 font-medium">Error: {error}</div>;

  return (
    <div className="w-full space-y-6">
      {/* Search Input */}
      <div className="relative group">
        <label htmlFor="user-search" className="sr-only">
          Search by name, email, gender or age
        </label>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-zinc-500 transition-colors">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          id="user-search"
          type="text"
          placeholder="Search by name, email, gender or age..."
          className="block w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-zinc-800 rounded-xl leading-5 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/10 dark:focus:ring-white/10 focus:border-zinc-500 dark:focus:border-zinc-700 sm:text-sm transition-all"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
        />
        {/* Screen reader only status region */}
        <div className="sr-only" aria-live="polite">
          {searchQuery ? `${sortedUsers.length} results found for ${searchQuery}` : ""}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-zinc-800">
            <thead className="bg-gray-50/50 dark:bg-zinc-800/50">
              <tr>
                {[
                  { label: "First Name", key: "name.first" },
                  { label: "Gender", key: "gender" },
                  { label: "Age", key: "dob.age" },
                  { label: "Email", key: "email" },
                ].map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    role="button"
                    tabIndex={0}
                    aria-sort={
                      sortConfig.key === col.key
                        ? sortConfig.direction === "asc"
                          ? "ascending"
                          : sortConfig.direction === "desc"
                          ? "descending"
                          : "none"
                        : "none"
                    }
                    className="px-6 py-4 text-left text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest cursor-pointer hover:bg-gray-100/50 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-zinc-500/20"
                    onClick={() => handleSort(col.key as SortKey)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSort(col.key as SortKey);
                      }
                    }}
                  >
                    <div className="flex items-center">
                      {col.label}
                      <SortIcon column={col.key as SortKey} sortConfig={sortConfig} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-50 dark:divide-zinc-800">
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <tr key={user.email} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors group">
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-zinc-100">
                      {user.name.first}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 dark:text-zinc-400">
                      {user.gender}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 dark:text-zinc-400">
                      {user.dob.age}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors">
                      {user.email}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-sm text-gray-400 dark:text-zinc-500 font-medium bg-gray-50/30 dark:bg-zinc-800/10">
                    No matching users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
        <div className="text-sm text-gray-500 dark:text-zinc-400 order-2 sm:order-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
          <div>
            Showing <span className="font-semibold text-zinc-900 dark:text-white">{sortedUsers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to{" "}
            <span className="font-semibold text-zinc-900 dark:text-white">
              {Math.min(currentPage * pageSize, sortedUsers.length)}
            </span>{" "}
            of <span className="font-semibold text-zinc-900 dark:text-white">{sortedUsers.length}</span> records
          </div>
          <div className="hidden sm:block w-px h-4 bg-gray-200 dark:bg-zinc-800" aria-hidden="true" />
          <div className="font-medium">
            Page <span className="text-zinc-900 dark:text-white">{currentPage}</span> of <span className="text-zinc-900 dark:text-white">{totalPages || 1}</span>
          </div>
        </div>
        <div className="flex gap-2 order-1 sm:order-2 w-full sm:w-auto">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-5 py-2.5 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm font-semibold text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            aria-label="Next page"
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-5 py-2.5 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm font-semibold text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
          >
            Next
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
