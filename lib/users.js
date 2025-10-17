export function serializeUser(userDoc) {
  return {
    id: String(userDoc._id),
    name: userDoc.name,
    email: userDoc.email,
    role: userDoc.role || 'user',
    personType: userDoc.personType || 'natural',
    phone: userDoc.phone || '',
    address: userDoc.address || '',
    rut: userDoc.rut || '',
    businessName: userDoc.businessName || '',
    avatarUrl: userDoc.avatarUrl || '',
    avatarPublicId: userDoc.avatarPublicId || '',
  };
}
