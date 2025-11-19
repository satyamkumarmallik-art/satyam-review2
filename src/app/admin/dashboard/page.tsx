
"use client";

import * as React from "react";
import { Star, MessageSquare, Send, Trash2, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion"
import { useToast } from "@/hooks/use-toast";
import { subjects, addDailyUpdate, useReviews, type DailyUpdate, type Review, type Subject, clearAllReviews } from "@/lib/data";
import { useFirebase } from "@/firebase";

// Helper function to find a subject by name (case-insensitive)
const getSubjectByName = (name: string): Subject | undefined => {
    return subjects.find(s => s.name.toLowerCase() === name.toLowerCase());
};

const getSubjectById = (id: string): Subject | undefined => {
    return subjects.find(s => s.id === id);
}

export default function AdminDashboardPage() {
    const { data: allReviews, loading: reviewsLoading } = useReviews();
    const { database } = useFirebase();

    const [subjectName, setSubjectName] = React.useState('');
    const [teacherName, setTeacherName] = React.useState('');
    const [updateContent, setUpdateContent] = React.useState('');
    const { toast } = useToast();

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subjectName.trim() || !updateContent.trim() || !teacherName.trim()) {
            toast({
                title: 'Missing Information',
                description: 'Please fill out all fields: subject, teacher, and update content.',
                variant: 'destructive',
            });
            return;
        }

        const foundSubject = getSubjectByName(subjectName);
        const subjectId = foundSubject ? foundSubject.id : subjectName.toLowerCase().replace(/\s+/g, '-');


        const newUpdate: Omit<DailyUpdate, 'id'> = {
            subjectId: subjectId,
            subjectName: subjectName,
            teacherName: teacherName,
            content: updateContent,
            date: new Date().toISOString(),
        };

        try {
            await addDailyUpdate(newUpdate, database);
            toast({
                title: 'Update Posted!',
                description: `Your daily update for ${subjectName} has been posted.`,
            });
            // Reset form
            setSubjectName('');
            setTeacherName('');
            setUpdateContent('');
        } catch (error) {
            console.error("Failed to post update:", error);
            toast({
                title: 'Error',
                description: 'Failed to post update. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const handleClearReviews = async () => {
        try {
            await clearAllReviews(database);
            toast({
                title: 'Reviews Cleared',
                description: 'All student reviews have been successfully deleted.',
            })
        } catch (error) {
            console.error("Failed to clear reviews:", error);
            toast({
                title: 'Error',
                description: 'Failed to clear reviews. Please try again.',
                variant: 'destructive',
            })
        }
    }
    
    // Group all reviews by subjectId
    const reviewsBySubject = allReviews.reduce((acc, review) => {
      const { subjectId } = review;
      if (!acc[subjectId]) {
        const subjectDetails = getSubjectById(subjectId) || { name: review.subjectName, icon: subjects[0].icon };
        acc[subjectId] = {
          ...subjectDetails,
          id: subjectId,
          reviews: [],
        };
      }
      acc[subjectId].reviews.push(review);
      return acc;
    }, {} as Record<string, Subject & { reviews: Review[] }>);

    const subjectsWithReviews = Object.values(reviewsBySubject);


  return (
    <main className="flex-1 p-4 sm:px-6 sm:py-4">
      <Tabs defaultValue="updates">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="updates">Post Daily Update</TabsTrigger>
          <TabsTrigger value="reviews">View Reviews</TabsTrigger>
        </TabsList>
        <TabsContent value="updates">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">What did you teach today?</CardTitle>
              <CardDescription>
                Post an update for your students to see and review.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateSubmit} className="grid gap-6">
                <div className="grid gap-2">
                    <Input
                        placeholder="Enter subject name (e.g., Mathematics)"
                        value={subjectName}
                        onChange={(e) => setSubjectName(e.target.value)}
                    />
                </div>
                 <div className="grid gap-2">
                    <Input
                        placeholder="Enter your name"
                        value={teacherName}
                        onChange={(e) => setTeacherName(e.target.value)}
                    />
                </div>
                <div className="grid gap-2">
                  <Textarea
                    placeholder="Describe today's lesson, topics covered, and any announcements."
                    rows={6}
                    value={updateContent}
                    onChange={(e) => setUpdateContent(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full md:w-auto md:justify-self-start">
                    <Send className="mr-2 h-4 w-4"/>
                    Post Update
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reviews">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline">All Student Feedback</CardTitle>
                <CardDescription>
                  Here are all the reviews that have been submitted by students.
                </CardDescription>
              </div>
               <Button variant="destructive" onClick={handleClearReviews}>
                <Trash2 className="mr-2 h-4 w-4"/>
                Clear All Reviews
              </Button>
            </CardHeader>
            <CardContent>
              {reviewsLoading ? (
                <div className="flex justify-center items-center py-10">
                    <Loader className="h-8 w-8 animate-spin" />
                </div>
              ) : subjectsWithReviews.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                    {subjectsWithReviews.map((subject) => {
                     const Icon = subject.icon ? subject.icon : subjects[0].icon;
                     return (
                        <AccordionItem key={subject.id} value={subject.id}>
                          <AccordionTrigger>
                            <div className="flex items-center gap-3">
                                <Icon className="h-5 w-5 text-primary"/>
                                <span className="font-semibold">{subject.name}</span>
                                <span className="text-sm text-muted-foreground">({subject.reviews.length} reviews)</span>
                            </div>
                            </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 pt-2">
                            {subject.reviews.map(review => (
                                <div key={review.id} className="p-4 bg-background rounded-lg border">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-foreground">{review.studentName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Reg No: {review.registrationNumber}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{new Date(review.date).toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center gap-1 text-yellow-500">
                                            <span className="text-sm font-bold">{review.rating}</span>
                                            <Star className="h-4 w-4 fill-current"/>
                                        </div>
                                    </div>
                                    {review.comment && (
                                        <p className="mt-3 text-sm text-foreground/80 italic border-l-2 border-primary pl-3">"{review.comment}"</p>
                                    )}
                                </div>
                            ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                </Accordion>
              ) : (
                <div className="text-center text-muted-foreground py-10">
                    <MessageSquare className="mx-auto h-12 w-12" />
                    <p className="mt-4">No student reviews have been submitted yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
