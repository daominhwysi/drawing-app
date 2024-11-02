// DropdownMenuComponent.js
'use client';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HamburgerMenuIcon } from '@radix-ui/react-icons';

const MenuComponent = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="fixed top-4 left-4 z-10">
          <HamburgerMenuIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="ml-4">
        <DropdownMenuItem>
          <button className="flex items-center justify-between w-full p-2 rounded">
            Open            
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MenuComponent;
