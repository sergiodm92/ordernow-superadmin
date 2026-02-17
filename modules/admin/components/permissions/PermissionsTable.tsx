import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useEffect, useMemo, useState } from 'react';
import React from 'react';
import { PermissionDTO } from '../../types/permission';
import { useToast } from '@/hooks/useToast';
import toastConfirm from '@/components/common/ToastConfirm';

interface PermissionsTableProps {
  permissions: PermissionDTO[];
  onEdit: (permission: PermissionDTO) => void;
  onDelete: (permissionId: string) => void;
}

export function PermissionsTable({ permissions = [], onEdit, onDelete }: PermissionsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPermissions, setFilteredPermissions] = useState<PermissionDTO[]>([]);
  const [expandedFeatures, setExpandedFeatures] = useState<string[]>([]);
  const { toast } = useToast();

  const toggleFeature = (feature: string) => {
    setExpandedFeatures(prev =>
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  useEffect(() => {
    const filtered = permissions.filter((permission) => {
      const searchTermLower = searchTerm.toLowerCase();
      const [feature = '', action = ''] = permission.name.split(':');
      
      return feature.toLowerCase().includes(searchTermLower) ||
        action.toLowerCase().includes(searchTermLower) ||
        permission.description.toLowerCase().includes(searchTermLower);
    });
    
    // Ordenar por feature (parte antes del :)
    const sorted = [...filtered].sort((a, b) => {
      const featureA = a.name.split(':')[0] || '';
      const featureB = b.name.split(':')[0] || '';
      return featureA.localeCompare(featureB);
    });
    
    setFilteredPermissions(sorted);
  }, [permissions, searchTerm]);

  const groupedPermissions = useMemo(() => {
    return filteredPermissions.reduce<Record<string, PermissionDTO[]>>((acc, permission) => {
      const [feature = 'Sin categoría'] = permission.name.split(':');
      
      if (!acc[feature]) {
        acc[feature] = [];
      }
      acc[feature].push(permission);
      return acc;
    }, {});
  }, [filteredPermissions]);

  const handleDelete = async (permissionId: string) => {
    toastConfirm(
      async () => {
        try {
          await onDelete(permissionId);
          toast({
            title: 'Permiso eliminado',
            description: 'El permiso ha sido eliminado exitosamente',
          });
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Hubo un error al eliminar el permiso',
            variant: 'destructive',
          });
        }
      },
      '¿Estás seguro de eliminar este permiso?',
    );
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Buscar permisos..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Característica</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(groupedPermissions).map(([feature, permissions]) => (
              <React.Fragment key={feature}>
                <TableRow className="bg-muted/50 cursor-pointer hover:bg-muted">
                  <TableCell colSpan={4} className="font-medium">
                    <div 
                      className="flex items-center space-x-2" 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFeature(feature);
                      }}
                    >
                      <Button variant="ghost" size="sm" className="p-0">
                        {expandedFeatures.includes(feature) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      <span>{feature} ({permissions.length})</span>
                    </div>
                  </TableCell>
                </TableRow>
                {expandedFeatures.includes(feature) && permissions.map((permission) => (
                  <TableRow key={permission.id} className="hover:bg-muted/50">
                    <TableCell className="pl-10"></TableCell>
                    <TableCell>{permission.name.split(':')[1] || permission.name}</TableCell>
                    <TableCell>{permission.description}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(permission);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(permission.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}