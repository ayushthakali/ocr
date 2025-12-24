"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function DialogComp({
  title,
  description,
  handleClick,
  action,
  classname,
  isLoading,
  loadingText,
}: {
  title: string;
  description: string;
  handleClick: () => Promise<void>;
  action: string;
  classname: string;
  isLoading: boolean;
  loadingText: string;
}) {
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    await handleClick();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className={classname}>
          {/* <Icon className="w-5 h-5" /> */}
          {action}
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-gray-900 border border-white/20 shadow-md shadow-purple-400/30 text-white">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className=" text-white">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="outline"
              disabled={isLoading}
              className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-200 hover:text-white"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            className={classname}
            disabled={isLoading}
          >
            {isLoading ? loadingText : action}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
