type UserType = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  roles?: UserRole[];
  dni: string;
};

type UserRole = {
  id: string;
  key: "ADMIN" | "SUPERVISOR" | "OPERADOR" | string;
  name?: string;
};
export default UserType;