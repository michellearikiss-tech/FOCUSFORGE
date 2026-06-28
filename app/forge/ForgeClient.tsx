"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";


export default function ForgeClient({
  initialUser,
}: {
  initialUser: User | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [authChecked, setAuthChecked] = useState(true);


}