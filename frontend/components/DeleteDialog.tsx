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
import { Trash2 } from "lucide-react";

export function DeleteDialog({
  title,
  description,
  handleClick,
}: {
  title: string;
  description: string;
  handleClick: () => void;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-all cursor-pointer"
        >
          <Trash2 className="w-5 h-5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg text-white">
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
              className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-200 hover:text-white"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleClick}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
