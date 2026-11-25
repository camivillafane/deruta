import { User } from '../../entities/index.js';

export type PublicUser = Pick<User, 'id' | 'name' | 'lastName' | 'profileImage' | 'rating' | 'totalTrips'>;

export function toPublicUser(user: User | null | undefined): PublicUser | null {
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    name: user.name,
    lastName: user.lastName,
    profileImage: user.profileImage,
    rating: user.rating,
    totalTrips: user.totalTrips,
  };
}

export function withPublicUser<T extends { user?: User | null }>(
  record: T,
  userKey: keyof T = 'user' as keyof T,
): Omit<T, typeof userKey> & { [K in typeof userKey]: PublicUser | null } {
  const { [userKey]: user, ...rest } = record;
  return { ...rest, [userKey]: toPublicUser(user as User | null) } as any;
}
