
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { ref, set } from "firebase/database";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";

export default function StudentSignupPage() {
  const router = useRouter();
  const { auth, database } = useFirebase();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = React.useState(false);
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [registrationNumber, setRegistrationNumber] = React.useState("");
  const [password, setPassword] = React.useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth || !database) {
        toast({ title: "Error", description: "Auth or Database service not ready.", variant: "destructive" });
        return;
    }
     if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter a valid email address to sign up.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const uid = user.uid;

        // Update Firebase Auth profile
        await updateProfile(user, { displayName: fullName, photoURL: null });

        // Create a user document in Realtime Database
        await set(ref(database, "users/" + uid), {
            uid: uid,
            displayName: fullName,
            email: user.email,
            registrationNumber: registrationNumber,
            photoURL: null
        });
        
        // Create a public mapping from registration number to UID
        await set(ref(database, "registrationNumbers/" + registrationNumber), {
            uid: uid
        });


        // Store registration number for login convenience
        localStorage.setItem('studentRegNo', registrationNumber);
        
        toast({
            title: "Account Created!",
            description: "You can now log in with your credentials.",
        });

        router.push("/login");

    } catch (error: any) {
        console.error("Signup Error:", error);
        toast({
            title: "Signup Failed",
            description: error.message || "Could not create account.",
            variant: "destructive",
        });
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="items-center text-center">
          <Logo />
          <CardTitle className="font-lobster text-3xl pt-4">Create an Account</CardTitle>
          <CardDescription>
            Enter your details to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input 
                id="full-name" 
                placeholder="John Doe" 
                required 
                value={fullName} 
                onChange={e => setFullName(e.target.value)} 
                />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="m@example.com" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
                />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reg-number">Registration Number</Label>
              <Input
                id="reg-number"
                placeholder="e.g., 21CS123"
                required
                value={registrationNumber}
                onChange={e => setRegistrationNumber(e.target.value)}
              />
            </div>
            <div className="grid gap-2 relative">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[2.3rem] text-muted-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <Button type="submit" className="w-full">
              Create account
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
