export interface Plan {
  id: number;
  planType: string;
  displayName: string;
  description: string;
  maxMenuItems: number;
  maxTables: number;
  maxEmployees: number;
  maxCategories: number;
  maxOptionGroups: number;
  maxPromotions: number;
  deliveryEnabled: boolean;
  monthlyPriceUsd: number;
  yearlyPriceUsd: number;
  active: boolean;
}

export interface CreatePlanDto {
  planType: string;
  displayName: string;
  description: string;
  maxMenuItems: number;
  maxTables: number;
  maxEmployees: number;
  maxCategories: number;
  maxOptionGroups: number;
  maxPromotions: number;
  deliveryEnabled: boolean;
  monthlyPriceUsd: number;
  yearlyPriceUsd: number;
  active: boolean;
}

export interface UpdatePlanDto extends CreatePlanDto {
  id: number;
}
