export type UserRole = 'admin' | 'staff';

export type VenueType = 'restaurant' | 'cafe' | 'club' | 'seafood';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  venue?: VenueType; // Defined only if role is 'staff'
  displayName: string;
  waiterId?: string;
  avatarColor?: string;
  assignedTableIds?: string[];
}
