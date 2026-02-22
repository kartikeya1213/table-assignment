export interface User {
  gender: string;
  name: {
    title: string;
    first: string;
    last: string;
  };
  email: string;
  dob: {
    date: string;
    age: number;
  };
}

export type SortKey = "name.first" | "gender" | "dob.age" | "email";
export type SortDirection = "asc" | "desc" | null;

export const filterUsers = (users: User[], query: string): User[] => {
  const searchStr = query.trim();
  if (!searchStr) return users;

  return users.filter((user) => {
    const firstName = user.name.first;
    const lastName = user.name.last;
    const fullName = `${firstName} ${lastName}`;
    const gender = user.gender;
    const email = user.email;
    const age = user.dob.age.toString();

    // Specific logic for gender to avoid male/female overlap issues
    // If searching exactly for "male", don't match "female" (case-sensitive)
    const genderMatch = searchStr === "male" ? gender === "male" : gender.includes(searchStr);

    return (
      firstName.includes(searchStr) ||
      lastName.includes(searchStr) ||
      fullName.includes(searchStr) ||
      genderMatch ||
      email.includes(searchStr) ||
      age.includes(searchStr)
    );
  });
};

/**
 * Extract sortable value from user object based on key
 */
export const getSortValue = (user: User, key: SortKey): string | number => {
  switch (key) {
    case "name.first": return user.name.first.toLowerCase();
    case "gender": return user.gender.toLowerCase();
    case "dob.age": return user.dob.age;
    case "email": return user.email.toLowerCase();
    default: return "";
  }
};

/**
 * Sort users based on configuration
 */
export const sortUsers = (
  users: User[],
  sortConfig: { key: SortKey; direction: SortDirection }
): User[] => {
  const { key, direction } = sortConfig;
  if (!direction || !key) return users;

  return [...users].sort((a, b) => {
    const aValue = getSortValue(a, key);
    const bValue = getSortValue(b, key);

    if (aValue < bValue) return direction === "asc" ? -1 : 1;
    if (aValue > bValue) return direction === "asc" ? 1 : -1;
    return 0;
  });
};

/**
 * Paginate data
 */
export const paginateData = <T,>(data: T[], page: number, pageSize: number): T[] => {
  const start = (page - 1) * pageSize;
  return data.slice(start, start + pageSize);
};
