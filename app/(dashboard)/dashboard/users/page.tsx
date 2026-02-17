"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFetchUsers } from "@/modules/admin/hooks/useFetchUsers";
import { useUsersStore } from "@/modules/admin/store/user";
import { useFetchRoles } from "@/modules/admin/hooks/useFetchRoles";
import { useRolesStore } from "@/modules/admin/store/roles";
import CreateUserDialog from "@/modules/admin/components/users/CreateUserDialog";
import { EditUserDialog } from "@/modules/admin/components/users/EditUserDialog";
import { DeleteUserDialog } from "@/modules/admin/components/users/DeleteUserDialog";
import { Badge } from "@/components/ui/badge";
import { Star, Shield } from "lucide-react";

export default function UsersPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('');

  const { fetchUsers } = useFetchUsers(page, size);
  const { users, totalElements } = useUsersStore();
  useFetchRoles();
  const { roles } = useRolesStore();

  const totalPages = Math.ceil(totalElements / size);

  const handlePreviousPage = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages - 1) {
      setPage(page + 1);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Users</h2>
        <CreateUserDialog roles={roles} onUserCreated={fetchUsers} />
      </div>
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              A list of all users in your organization ({totalElements} total users).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="w-[200px]">
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                >
                  <option value="">Todos los roles</option>
                  {roles.map((role: any) => (
                    <option key={role.name} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Email Verify</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users
                  .filter((user) => {
                    const searchMatch = searchTerm.toLowerCase() === '' ||
                      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      user.email.toLowerCase().includes(searchTerm.toLowerCase());

                    const roleMatch = selectedRoleFilter === '' ||
                      user.roles.some(role => role.name === selectedRoleFilter);

                    return searchMatch && roleMatch;
                  })
                  .map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {user.roles.map((role) => (
                          <div key={`${user.id}-${role.id}`} className="flex items-center gap-1">
                            {role.isDefault && <Star className="h-4 w-4 text-yellow-500" />}
                            <Badge variant="secondary" className="flex items-center gap-1">
                              {role.name}
                              {role.level && (
                                <span className="ml-1 flex items-center">
                                  <Shield className="h-3 w-3" />
                                  {role.level}
                                </span>
                              )}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.emailVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.emailVerified ? 'Verify' : 'Not Verify'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <EditUserDialog
                        user={user}
                        roles={roles}
                        onSuccess={fetchUsers}
                      />
                      <DeleteUserDialog
                        userId={user.id}
                        userName={`${user.firstName} ${user.lastName}`}
                        onSuccess={fetchUsers}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {page * size + 1} to {Math.min((page + 1) * size, totalElements)} of {totalElements} users
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={handlePreviousPage}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
