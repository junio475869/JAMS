import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Document, DocumentType, insertDocumentSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import DocumentList from "@/components/document-list";
import { useToast } from "@/hooks/use-toast";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  User,
  Briefcase,
  Plus,
  Calendar,
  FileIcon,
} from "lucide-react";

// Form schema that extends the insertDocumentSchema
const documentFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  content: z.string().min(1, "Content is required"),
});

type DocumentFormValues = z.infer<typeof documentFormSchema>;

export default function DocumentsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  // Filter documents by type
  const resumes = documents.filter((doc) => doc.type === DocumentType.RESUME);
  const coverLetters = documents.filter(
    (doc) => doc.type === DocumentType.COVER_LETTER,
  );
  const displayDocuments =
    activeTab === "all"
      ? documents
      : activeTab === "resumes"
        ? resumes
        : coverLetters;

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Form for creating/editing documents
  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      name: "",
      type: DocumentType.RESUME,
      content: "",
    },
  });

  // Create document mutation
  const createDocumentMutation = useMutation({
    mutationFn: async (data: DocumentFormValues) => {
      const res = await apiRequest("POST", "/api/documents", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Document created",
        description: "Your document has been successfully created",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating document",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update document mutation
  const updateDocumentMutation = useMutation({
    mutationFn: async (data: { id: number; document: DocumentFormValues }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/documents/${data.id}`,
        data.document,
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setIsEditDialogOpen(false);
      form.reset();
      toast({
        title: "Document updated",
        description: "Your document has been successfully updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating document",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setIsDeleteDialogOpen(false);
      setCurrentDocument(null);
      toast({
        title: "Document deleted",
        description: "Your document has been successfully deleted",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting document",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission for create
  const onCreateSubmit = (data: DocumentFormValues) => {
    createDocumentMutation.mutate(data);
  };

  // Handle form submission for edit
  const onEditSubmit = (data: DocumentFormValues) => {
    if (currentDocument) {
      updateDocumentMutation.mutate({ id: currentDocument.id, document: data });
    }
  };

  // Handle new document button
  const handleNewDocument = () => {
    form.reset({
      name: "",
      type: DocumentType.RESUME,
      content: "",
    });
    setIsCreateDialogOpen(true);
  };

  // Handle edit document
  const handleEditDocument = (document: Document) => {
    setCurrentDocument(document);
    form.reset({
      name: document.name,
      type: document.type,
      content: document.content,
    });
    setIsEditDialogOpen(true);
  };

  // Handle view document
  const handleViewDocument = (document: Document) => {
    setCurrentDocument(document);
    setIsViewDialogOpen(true);
  };

  // Handle delete document
  const handleDeleteDocument = (documentId: number) => {
    const document = documents.find((doc) => doc.id === documentId);
    if (document) {
      setCurrentDocument(document);
      setIsDeleteDialogOpen(true);
    }
  };

  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (currentDocument) {
      deleteDocumentMutation.mutate(currentDocument.id);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Documents</h1>
          <p className="text-gray-400 mt-1">
            Manage your resumes and cover letters
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={handleNewDocument}>
            <Plus className="h-4 w-4 mr-2" />
            New Document
          </Button>
        </div>
      </div>

      {/* Document Tabs */}
      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="bg-gray-800 border-b border-gray-700 rounded-md">
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="resumes">Resumes</TabsTrigger>
          <TabsTrigger value="coverletters">Cover Letters</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayDocuments.map((document) => (
              <Card
                key={document.id}
                className="bg-gray-800 border-gray-700 hover:border-gray-600 cursor-pointer transition-colors"
                onClick={() => handleViewDocument(document)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className={`h-8 w-8 ${document.type === DocumentType.RESUME ? "bg-blue-900/30 text-blue-400" : "bg-purple-900/30 text-purple-400"} flex items-center justify-center rounded mr-3`}
                      >
                        <FileText className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-lg text-white">
                        {document.name}
                      </CardTitle>
                    </div>
                    <div className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                      {document.type === DocumentType.RESUME
                        ? "Resume"
                        : "Cover Letter"}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-400 line-clamp-3">
                    {document.content.substring(0, 150)}...
                  </p>
                </CardContent>
                <CardFooter className="border-t border-gray-700 pt-4 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Version {document.version}
                  </span>
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditDocument(document);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}

            {displayDocuments.length === 0 && !isLoading && (
              <div className="col-span-full flex flex-col items-center justify-center h-64 border border-dashed border-gray-700 rounded-lg p-6">
                <FileIcon className="h-12 w-12 text-gray-500 mb-4" />
                <h3 className="text-lg font-medium text-white">
                  No documents yet
                </h3>
                <p className="text-gray-400 text-center mt-2 mb-4">
                  Add your first resume or cover letter to get started
                </p>
                <Button onClick={handleNewDocument}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Document
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="resumes" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map((document) => (
              <Card
                key={document.id}
                className="bg-gray-800 border-gray-700 hover:border-gray-600 cursor-pointer transition-colors"
                onClick={() => handleViewDocument(document)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-blue-900/30 text-blue-400 flex items-center justify-center rounded mr-3">
                        <FileText className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-lg text-white">
                        {document.name}
                      </CardTitle>
                    </div>
                    <div className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                      Resume
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-400 line-clamp-3">
                    {document.content.substring(0, 150)}...
                  </p>
                </CardContent>
                <CardFooter className="border-t border-gray-700 pt-4 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Version {document.version}
                  </span>
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditDocument(document);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}

            {resumes.length === 0 && !isLoading && (
              <div className="col-span-full flex flex-col items-center justify-center h-64 border border-dashed border-gray-700 rounded-lg p-6">
                <FileIcon className="h-12 w-12 text-gray-500 mb-4" />
                <h3 className="text-lg font-medium text-white">
                  No resumes yet
                </h3>
                <p className="text-gray-400 text-center mt-2 mb-4">
                  Create your first resume to get started
                </p>
                <Button onClick={handleNewDocument}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Resume
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="coverletters" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coverLetters.map((document) => (
              <Card
                key={document.id}
                className="bg-gray-800 border-gray-700 hover:border-gray-600 cursor-pointer transition-colors"
                onClick={() => handleViewDocument(document)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-purple-900/30 text-purple-400 flex items-center justify-center rounded mr-3">
                        <FileText className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-lg text-white">
                        {document.name}
                      </CardTitle>
                    </div>
                    <div className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                      Cover Letter
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-400 line-clamp-3">
                    {document.content.substring(0, 150)}...
                  </p>
                </CardContent>
                <CardFooter className="border-t border-gray-700 pt-4 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Version {document.version}
                  </span>
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditDocument(document);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}

            {coverLetters.length === 0 && !isLoading && (
              <div className="col-span-full flex flex-col items-center justify-center h-64 border border-dashed border-gray-700 rounded-lg p-6">
                <FileIcon className="h-12 w-12 text-gray-500 mb-4" />
                <h3 className="text-lg font-medium text-white">
                  No cover letters yet
                </h3>
                <p className="text-gray-400 text-center mt-2 mb-4">
                  Create your first cover letter to get started
                </p>
                <Button onClick={handleNewDocument}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Cover Letter
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Document Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Document</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add a new resume or cover letter to your collection.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onCreateSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="E.g. Software Engineer Resume 2023"
                        {...field}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white">
                        <SelectItem value={DocumentType.RESUME}>
                          Resume
                        </SelectItem>
                        <SelectItem value={DocumentType.COVER_LETTER}>
                          Cover Letter
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your document content here"
                        {...field}
                        className="min-h-[300px] bg-gray-700 border-gray-600 text-white"
                      />
                    </FormControl>
                    <FormDescription className="text-gray-400">
                      Paste your resume or cover letter content here. We'll
                      store and version it for you.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createDocumentMutation.isPending}
                >
                  {createDocumentMutation.isPending
                    ? "Creating..."
                    : "Create Document"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Document Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription className="text-gray-400">
              Make changes to your document. This will create a new version.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onEditSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white">
                        <SelectItem value={DocumentType.RESUME}>
                          Resume
                        </SelectItem>
                        <SelectItem value={DocumentType.COVER_LETTER}>
                          Cover Letter
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Content</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="min-h-[300px] bg-gray-700 border-gray-600 text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className="bg-transparent text-red-400 border-red-400 hover:bg-red-900/20"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    if (currentDocument) {
                      handleDeleteDocument(currentDocument.id);
                    }
                  }}
                >
                  Delete
                </Button>
                <div className="flex-1"></div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateDocumentMutation.isPending}
                >
                  {updateDocumentMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-3xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div
                  className={`h-8 w-8 ${currentDocument?.type === DocumentType.RESUME ? "bg-blue-900/30 text-blue-400" : "bg-purple-900/30 text-purple-400"} flex items-center justify-center rounded mr-3`}
                >
                  <FileText className="h-4 w-4" />
                </div>
                <DialogTitle>{currentDocument?.name}</DialogTitle>
              </div>
              <div className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                {currentDocument?.type === DocumentType.RESUME
                  ? "Resume"
                  : "Cover Letter"}
              </div>
            </div>
            <DialogDescription className="text-gray-400 mt-2">
              Version {currentDocument?.version} • Last updated on{" "}
              {currentDocument?.updatedAt.toString().substring(0, 10)}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-gray-750 rounded-md p-4 max-h-[500px] overflow-auto whitespace-pre-wrap">
            {currentDocument?.content}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="bg-transparent text-red-400 border-red-400 hover:bg-red-900/20"
              onClick={() => {
                setIsViewDialogOpen(false);
                if (currentDocument) {
                  handleDeleteDocument(currentDocument.id);
                }
              }}
            >
              Delete
            </Button>
            <div className="flex-1"></div>
            <Button
              onClick={() => {
                setIsViewDialogOpen(false);
                if (currentDocument) {
                  handleEditDocument(currentDocument);
                }
              }}
            >
              Edit Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-gray-800 border-gray-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This action cannot be undone. This will permanently delete your
              document "{currentDocument?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
              disabled={deleteDocumentMutation.isPending}
            >
              {deleteDocumentMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
