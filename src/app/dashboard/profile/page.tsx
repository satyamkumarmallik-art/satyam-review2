
"use client";

import * as React from "react";
import { Upload, User, Mail, Hash, Loader } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase/auth/use-user";
import { useFirebase } from "@/firebase";
import { ref, get, update } from "firebase/database";
import { updateProfile } from "firebase/auth";

type StudentInfo = {
    name: string | null;
    regNo: string | null;
    email: string | null;
    profilePic: string | null;
};

export default function ProfilePage() {
    const { toast } = useToast();
    const { user, loading: userLoading } = useUser();
    const { database, auth } = useFirebase();
    const [studentInfo, setStudentInfo] = React.useState<StudentInfo>({
        name: null,
        regNo: null,
        email: null,
        profilePic: null,
    });
    const [loading, setLoading] = React.useState(true);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        const fetchStudentInfo = async () => {
            if (user && database) {
                setLoading(true);
                const userRef = ref(database, `users/${user.uid}`);
                const snapshot = await get(userRef);

                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    setStudentInfo({
                        name: userData.displayName,
                        email: userData.email,
                        regNo: userData.registrationNumber,
                        profilePic: userData.photoURL,
                    });
                } else {
                     // Fallback to auth details if database entry not found
                    setStudentInfo({
                        name: user.displayName,
                        email: user.email,
                        regNo: localStorage.getItem("studentRegNo"), // fallback
                        profilePic: user.photoURL,
                    });
                }
                setLoading(false);
            }
        };

        if (!userLoading) {
            fetchStudentInfo();
        }
    }, [user, userLoading, database]);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && user && database && auth?.currentUser) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const imageUrl = e.target?.result as string;

                try {
                    // Update Realtime Database
                    const userRef = ref(database, `users/${user.uid}`);
                    await update(userRef, { photoURL: imageUrl });
                    
                    // Also update auth profile
                    await updateProfile(auth.currentUser, { photoURL: imageUrl });
                    
                    setStudentInfo(prev => ({ ...prev, profilePic: imageUrl }));
                    toast({
                        title: "Profile Picture Updated",
                        description: "Your new photo has been saved.",
                    });

                } catch (error) {
                    console.error("Error updating profile picture:", error);
                     toast({
                        title: "Update Failed",
                        description: "Could not update your profile picture.",
                        variant: "destructive"
                    });
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    if (userLoading || loading) {
        return (
             <main className="flex flex-1 items-center justify-center p-4 sm:px-6 sm:py-0">
                <Loader className="h-10 w-10 animate-spin" />
            </main>
        )
    }

    return (
        <main className="flex flex-1 items-center justify-center p-4 sm:px-6 sm:py-0">
            <Card className="w-full max-w-lg shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl text-center">Student Profile</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="flex flex-col items-center gap-4">
                        <Avatar className="h-28 w-28 border-2 border-primary">
                            <AvatarImage src={studentInfo.profilePic || undefined} alt="Student profile picture" />
                            <AvatarFallback>
                                <User className="h-14 w-14" />
                            </AvatarFallback>
                        </Avatar>
                        <Button onClick={handleUploadClick}>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Photo
                        </Button>
                        <Input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*"
                        />
                    </div>
                    <div className="grid gap-4">
                        <div className="flex items-center gap-3 rounded-md border bg-muted/50 p-3">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <div className="grid gap-0.5">
                                <Label className="text-xs text-muted-foreground">Name</Label>
                                <p className="text-sm font-medium">{studentInfo.name || user?.displayName || "Not available"}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-md border bg-muted/50 p-3">
                            <Hash className="h-5 w-5 text-muted-foreground" />
                            <div className="grid gap-0.5">
                                <Label className="text-xs text-muted-foreground">Registration Number</Label>
                                <p className="text-sm font-medium">{studentInfo.regNo || "Not available"}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-md border bg-muted/50 p-3">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                            <div className="grid gap-0.5">
                                <Label className="text-xs text-muted-foreground">Email</Label>
                                <p className="text-sm font-medium">{studentInfo.email || user?.email || "Not available"}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}
