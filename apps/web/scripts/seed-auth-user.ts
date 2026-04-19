import { auth } from "../src/lib/auth"

async function seed() {
  const result = await auth.api.signUpEmail({
    body: {
      email: "priya@acme.co",
      password: "test123",
      name: "Priya Sharma",
    },
  })

  if (result) {
    console.log("Seeded user:", result.user?.email)
  }
}

seed().catch(console.error)
