export type SessionUser = {
  username: string;
  user_type: string;
  user_id: number;
  is_primary_admin?: boolean;
  must_change_password?: boolean;
  permissions?: string[];
  allowed_routes?: string[];
  home_route?: string;
};
