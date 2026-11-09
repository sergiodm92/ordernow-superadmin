"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFetchUsers } from "@/modules/admin/hooks/useFetchUsers";
import { useUsersStore } from "@/modules/admin/store/user";
import { useFetchRoles } from "@/modules/admin/hooks/useFetchRoles";
import { useRolesStore } from "@/modules/admin/store/roles";
import { useEstablishments } from "@/modules/admin/hooks/useEstablishments";
import { usePlans } from "@/modules/admin/hooks/usePlans";
import { useUserSubscriptions } from "@/modules/admin/hooks/useUserSubscriptions";
import { providerLabel, statusLabel } from "@/modules/admin/utils/subscriptionLabels";
import { IEstablishment } from "@/modules/admin/types/establishment";
import CreateUserDialog from "@/modules/admin/components/users/CreateUserDialog";
import { ChangePlanDialog } from "@/modules/admin/components/users/ChangePlanDialog";
import { EditUserDialog } from "@/modules/admin/components/users/EditUserDialog";
import { DeleteUserDialog } from "@/modules/admin/components/users/DeleteUserDialog";
import { Badge } from "@/components/ui/badge";
import { Star, Shield } from "lucide-react";

export default function UsersPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('');
  const [ownerFilter, setOwnerFilter] = useState<'all' | 'owners'>('all');

  const { fetchUsers } = useFetchUsers(page, size);
  const { users, totalElements } = useUsersStore();
  useFetchRoles();
  const { roles } = useRolesStore();
  const { establishments, fetchEstablishments } = useEstablishments();

  useEffect(() => {
    fetchEstablishments();
  }, [fetchEstablishments]);

  // GET /users/all doesn't say who owns what: an owner is whoever an establishment names as its
  // userOwnerId. The super admin gets every establishment, so this set is complete.
  const ownedEstablishments = useMemo(() => {
    const byOwner = new Map<string, IEstablishment[]>();
    for (const establishment of establishments) {
      const owned = byOwner.get(establishment.userOwnerId) ?? [];
      owned.push(establishment);
      byOwner.set(establishment.userOwnerId, owned);
    }
    return byOwner;
  }, [establishments]);

  // The plan belongs to the owner and limits everyone who works in their establishments, so it is
  // shown (and changed) on the owners only.
  const { plans } = usePlans();
  const assignablePlans = useMemo(() => plans.filter((plan) => plan.active !== false), [plans]);
  const ownerIds = useMemo(
    () => users.filter((user) => ownedEstablishments.has(user.id)).map((user) => user.id),
    [users, ownedEstablishments],
  );
  const { subscriptions, isLoading: loadingSubscriptions, isError: subscriptionsFailed } = useUserSubscriptions(ownerIds);

  // An owner that is not in the answer has no stored subscription: the implicit FREE plan.
  const freePlanName = plans.find((plan) => plan.planType === "FREE")?.displayName ?? "FREE";

  const renderPlan = (userId: string) => {
    if (!ownedEstablishments.has(userId)) return "—";
    if (subscriptionsFailed) return <span className="text-xs text-red-600">No se pudo cargar</span>;
    if (loadingSubscriptions) return <span className="text-muted-foreground">…</span>;

    const subscription = subscriptions.get(userId);
    if (!subscription) return <Badge variant="outline">{freePlanName}</Badge>;

    const detail =
      subscription.status !== "ACTIVE"
        ? statusLabel(subscription.status)
        : subscription.paymentProvider
          ? providerLabel(subscription.paymentProvider)
          : subscription.plan.planType !== "FREE"
            ? "Sin cobro"
            : null;
    return (
      <div className="flex flex-col gap-1">
        <Badge variant="outline" className="w-fit">{subscription.plan.displayName}</Badge>
        {detail && <span className="text-xs text-muted-foreground">{detail}</span>}
      </div>
    );
  };

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
              <div className="w-[220px]">
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={ownerFilter}
                  onChange={(e) => setOwnerFilter(e.target.value as 'all' | 'owners')}
                  aria-label="Filtrar por dueños de establecimientos"
                >
                  <option value="all">Todos los usuarios</option>
                  <option value="owners">Solo dueños de establecimientos</option>
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
                  <TableHead>Establecimiento</TableHead>
                  <TableHead>Plan</TableHead>
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

                    const ownerMatch = ownerFilter === 'all' || ownedEstablishments.has(user.id);

                    return searchMatch && roleMatch && ownerMatch;
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
                      {ownedEstablishments.get(user.id)?.map((est) => est.name).join(", ") ??
                        user.establishment?.name ??
                        "—"}
                    </TableCell>
                    <TableCell>{renderPlan(user.id)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.isEmailVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isEmailVerified ? 'Verify' : 'Not Verify'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {ownedEstablishments.has(user.id) && !loadingSubscriptions && !subscriptionsFailed && (
                        <ChangePlanDialog
                          user={user}
                          plans={assignablePlans}
                          subscription={subscriptions.get(user.id)}
                        />
                      )}
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
