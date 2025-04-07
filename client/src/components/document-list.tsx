import { useState } from "react";
import { Document, DocumentType } from "@shared/schema";
import { format } from "date-fns";
import { 
  FileText, 
  Plus, 
  MoreHorizontal,
  FileIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DocumentListProps {
  title: string;
  documents: Document[];
  type: "resume" | "cover_letter";
  isLoading: boolean;
  onNewDocument: () => void;
  onEditDocument: (document: Document) => void;
  onViewDocument: (document: Document) => void;
  onDeleteDocument: (documentId: number) => void;
}

export function DocumentList({
  title,
  documents,
  type,
  isLoading,
  onNewDocument,
  onEditDocument,
  onViewDocument,
  onDeleteDocument
}: DocumentListProps) {
  const getFormattedDate = (date: Date | string | null) => {
    if (!date) return "Updated recently";
    const dateObj = date instanceof Date ? date : new Date(date);
    return `Updated ${format(dateObj, 'PP')}`;
  };

  const getIconColor = () => {
    return type === "resume"
      ? "bg-blue-900/30 text-blue-400"
      : "bg-purple-900/30 text-purple-400";
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-white">{title}</h4>
          <Button variant="ghost" size="sm" className="text-primary-400 hover:text-primary-300">
            <Plus className="h-4 w-4 mr-1" /> New
          </Button>
        </div>
        <div className="space-y-3">
          <Skeleton className="flex items-center p-2 h-12 w-full rounded-md bg-gray-750" />
          <Skeleton className="flex items-center p-2 h-12 w-full rounded-md bg-gray-750" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-white">{title}</h4>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-primary-400 hover:text-primary-300"
          onClick={onNewDocument}
        >
          <Plus className="h-4 w-4 mr-1" /> New
        </Button>
      </div>
      <div className="space-y-3">
        {documents.length === 0 ? (
          <div className="flex items-center justify-center h-24 border border-dashed border-gray-700 rounded-lg">
            <span className="text-gray-500 text-sm">No documents yet</span>
          </div>
        ) : (
          documents.map(document => (
            <div 
              key={document.id} 
              className="flex items-center p-2 rounded-md hover:bg-gray-750 cursor-pointer"
              onClick={() => onViewDocument(document)}
            >
              <div className={`h-8 w-8 ${getIconColor()} flex items-center justify-center rounded mr-3`}>
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{document.name}</p>
                <p className="text-xs text-gray-400">{getFormattedDate(document.updatedAt)}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-400 hover:text-white"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 text-gray-200">
                  <DropdownMenuItem 
                    className="hover:bg-gray-700 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDocument(document);
                    }}
                  >
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="hover:bg-gray-700 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditDocument(document);
                    }}
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="hover:bg-gray-700 text-red-400 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDocument(document.id);
                    }}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default DocumentList;
