import { createClient } from "https://esm.run/@supabase/supabase-js";

const supabase = createClient(
  "https://bpwlgiiksovtccsrojko.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwd2xnaWlrc292dGNjc3JvamtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDc1NzIsImV4cCI6MjA3MjI4MzU3Mn0.Vrq9hTdWnGH0E6WQ0HvR_J8k7qax96FqkurJcr7VQkk"
);

(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    document.getElementById('app').classList.remove('hidden');
  }
})();
