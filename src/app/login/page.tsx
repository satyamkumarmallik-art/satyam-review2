
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { ref, get } from "firebase/database";

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
import { useFirebase } from "@/firebase";
import { getUserByRegistrationNumber } from "@/lib/data";


export default function StudentLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { auth, database } = useFirebase();

  const [showPassword, setShowPassword] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [registrationNumber, setRegistrationNumber] = React.useState("");


  const handleForgotPassword = async () => {
    if (!registrationNumber) {
      toast({
        title: "Registration Number Required",
        description: "Please enter your registration number to reset your password.",
        variant: "destructive",
      });
      return;
    }

    if (!auth || !database) {
      toast({
        title: "Error",
        description: "Authentication service not available.",
        variant: "destructive",
      });
      return;
    }

    try {
      const userSnapshot = await getUserByRegistrationNumber(registrationNumber, database);
      if (!userSnapshot.exists()) {
        throw new Error("No student found with this registration number.");
      }
      
      const userData = userSnapshot.val();
      const userEmail = userData.email;

      if (!userEmail) {
        throw new Error("Could not find an email associated with this account.");
      }

      await sendPasswordResetEmail(auth, userEmail);
      toast({
        title: "Password Reset Email Sent",
        description: `An email has been sent to ${userEmail} with instructions to reset your password.`,
      });

    } catch (error: any) {
      console.error("Forgot Password Error:", error);
      toast({
        title: "Failed to Send Reset Email",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!registrationNumber || !password) {
        toast({
            title: "Missing Information",
            description: "Please fill in all fields.",
            variant: "destructive",
        });
        return;
    }
    
    if (!auth || !database) {
        toast({
            title: "Error",
            description: "Authentication service is not available. Please try again later.",
            variant: "destructive",
        });
        return;
    }

    try {
        const userSnapshot = await getUserByRegistrationNumber(registrationNumber, database);

        if (!userSnapshot.exists()) {
            throw new Error("No student found with this registration number.");
        }
        
        const userData = userSnapshot.val();
        const userEmail = userData.email;

        if (!userEmail) {
            throw new Error("Could not find email for this student.");
        }
        
        await signInWithEmailAndPassword(auth, userEmail, password);
        localStorage.setItem('studentRegNo', registrationNumber);
        router.push("/dashboard");

    } catch (error: any) {
        console.error("Login Error:", error);
        toast({
            title: "Login Failed",
            description: error.message || "Invalid credentials. Please try again.",
            variant: "destructive",
        });
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="items-center text-center">
          <Logo />
          <CardTitle className="font-lobster text-3xl pt-4">Student Login</CardTitle>
          <CardDescription>Enter your credentials to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="reg-number">Registration Number</Label>
              <Input
                id="reg-number"
                placeholder="e.g., 21CS123"
                required
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
              />
            </div>
            <div className="grid gap-2 relative">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Button
                  type="button"
                  variant="link"
                  className="ml-auto h-auto p-0 text-sm"
                  onClick={handleForgotPassword}
                >
                  Forgot your password?
                </Button>
              </div>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              Login
            </Button>
            <Button variant="outline" className="w-full" asChild>
                <Link href="/admin/login">Teacher Login</Link>
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
