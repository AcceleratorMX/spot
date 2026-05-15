import { auth } from "@/auth";
import { NavbarClient } from "./navbar-client";

export async function Navbar() {
  const session = await auth();

  return (
    <NavbarClient
      user={
        session?.user
          ? { 
              name: session.user.name, 
              email: session.user.email,
              image: session.user.image 
            }
          : null
      }
    />
  );
}
