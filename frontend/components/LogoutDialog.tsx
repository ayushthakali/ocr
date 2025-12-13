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
import { useSidebar } from "@/context/contextSidebar";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutDialog({ handleClick }: { handleClick: () => void }) {
  const { isOpen } = useSidebar();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className={`relative flex w-full cursor-pointer flex-row-reverse justify-between items-center gap-2 group hover:text-white py-2 px-4 rounded transition-all duration-300 ease-in ${
            isOpen ? "hover:bg-white/20 " : ""
          }`}
        >
          <div className="flex-shrink-0 flex w-10 h-10 rounded-full flex items-center justify-center transform transition-all duration-300 ease-in bg-gray-800 group-hover:scale-105 group-hover:bg-gray-700">
            <LogOut className="w-5 h-5 group-hover:rotate-5 transition-all duration-300 ease-in text-gray-300" />
          </div>
          <h2 className="text-sm font-medium text-gray-300">Log out</h2>
        </button>
      </DialogTrigger>

      <DialogContent className="bg-gray-900 border border-white/20 shadow-md shadow-purple-400/50 text-white ">
        <DialogHeader>
          <DialogTitle>Confirm Log Out?</DialogTitle>
          <DialogDescription className=" text-white">
            Are you sure you want to log out?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="outline"
              className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-200 hover:text-white cursor-pointer"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            className="bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white cursor-pointer"
            onClick={handleClick}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
