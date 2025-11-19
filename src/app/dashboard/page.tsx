
"use client";

import * as React from "react";
import { Star, Send, UserCircle, CheckCircle, Loader } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { subjects, useDailyUpdates, addReview, useReviewedUpdatesForStudent, type DailyUpdate } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUser } from "@/firebase/auth/use-user";
import { useFirebase } from "@/firebase";


const StarRating = ({
  rating,
  setRating,
  disabled = false,
}: {
  rating: number;
  setRating: (rating: number) => void;
  disabled?: boolean;
}) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-6 w-6 transition-colors",
            rating >= star
              ? "text-yellow-400 fill-yellow-400"
              : "text-muted-foreground",
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          )}
          onClick={() => !disabled && setRating(star)}
        />
      ))}
    </div>
  );
};

export default function StudentDashboardPage() {
  const { user } = useUser();
  const { database } = useFirebase();
  const [studentInfo, setStudentInfo] = React.useState<{regNo: string | null, name: string | null}>({ regNo: null, name: null });
  
  React.useEffect(() => {
    const regNo = localStorage.getItem('studentRegNo');
    setStudentInfo({ regNo, name: user?.displayName });
  }, [user]);

  const { data: updates, loading: updatesLoading } = useDailyUpdates();
  const { data: reviewedUpdates, loading: reviewedLoading } = useReviewedUpdatesForStudent(user?.uid);
  const [ratings, setRatings] = React.useState<{[key: string]: number}>({});
  const [comments, setComments] = React.useState<{[key: string]: string}>({});
  const { toast } = useToast();
  
  const handleReviewSubmit = (update: DailyUpdate) => {
    const rating = ratings[update.id] || 0;
    const comment = comments[update.id] || '';

    if (rating === 0) {
        toast({
            title: "Rating Required",
            description: "Please select a star rating before submitting.",
            variant: "destructive",
        });
        return;
    }
    
    if (!studentInfo.regNo || !user || !studentInfo.name) {
        toast({
            title: "Error",
            description: "Could not find student information. Please log in again.",
            variant: "destructive",
        });
        return;
    }

    addReview({
        updateId: update.id,
        subjectId: update.subjectId,
        subjectName: update.subjectName,
        studentName: studentInfo.name,
        registrationNumber: studentInfo.regNo,
        rating,
        comment,
        date: new Date().toISOString(),
        studentId: user.uid,
    }, database);

    toast({
        title: "Review Submitted!",
        description: `Your review for ${update.subjectName} has been recorded.`,
    });
  };
  
  const getSubject = (subjectId: string) => subjects.find(s => s.id === subjectId);

  if (updatesLoading || reviewedLoading) {
      return (
          <div className="flex w-full h-full items-center justify-center">
              <Loader className="h-10 w-10 animate-spin" />
          </div>
      )
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {updates.map((update) => {
          const subject = getSubject(update.subjectId);
          const Icon = subject ? subject.icon : UserCircle;
          
          const isReviewed = reviewedUpdates.includes(update.id);
          
          return (
            <Card key={update.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <Icon className="h-6 w-6 text-primary" />
                        <CardTitle className="font-headline text-xl">{update.subjectName}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <UserCircle className="h-4 w-4" />
                        <span>{update.teacherName}</span>
                    </div>
                </div>
                <CardDescription>
                  Update for: {new Date(update.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-foreground">{update.content}</p>
              </CardContent>
              <Separator className="my-4" />
              <CardFooter className="flex flex-col items-start gap-4">
                 {isReviewed ? (
                    <div className="flex items-center gap-2 text-green-600 font-medium w-full justify-center py-8">
                        <CheckCircle className="h-5 w-5" />
                        <span>Review Submitted for this Update</span>
                    </div>
                 ) : (
                    <>
                    <h3 className="text-md font-semibold text-foreground">Submit Your Review</h3>
                    <div className="flex flex-col gap-4 w-full">
                        <StarRating 
                            rating={ratings[update.id] || 0} 
                            setRating={(r) => setRatings(prev => ({...prev, [update.id]: r}))}
                        />
                        <Textarea 
                            placeholder="Share your thoughts on today's lesson..." 
                            value={comments[update.id] || ''}
                            onChange={(e) => setComments(prev => ({...prev, [update.id]: e.target.value}))}
                        />
                        <Button onClick={() => handleReviewSubmit(update)}>
                            <Send className="mr-2 h-4 w-4" /> Submit Review
                        </Button>
                    </div>
                    </>
                 )}
              </CardFooter>
            </Card>
          );
        })}
         {updates.length === 0 && !updatesLoading && (
            <div className="col-span-full text-center text-muted-foreground mt-10">
                <p>No teaching updates available at the moment. Please check back later.</p>
            </div>
        )}
      </div>
    </main>
  );
}
