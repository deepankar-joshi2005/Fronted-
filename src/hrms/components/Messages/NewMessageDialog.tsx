import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquarePlus, Search, X, Users, Shield, GraduationCap, BookOpen, User as UserIcon, Loader2 } from "lucide-react";
import { getAvailableUsers, type User } from "@/api/messageService";
import { schoolService } from "@/api/schoolService";
import { cn } from "@/lib/utils";
import { usePaginatedSelect } from "@/hooks/usePaginatedSelect";

interface NewMessageDialogProps {
  onSelectUser: (userId: string) => void;
}

const NewMessageDialog: React.FC<NewMessageDialogProps> = ({ onSelectUser }) => {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("mentor");
  const [selectedSchool, setSelectedSchool] = useState<string>("all");
  const [currentUser, setCurrentUser] = useState<{
    role: string;
    schoolId?: string;
  } | null>(null);

  useEffect(() => {
    // Load current user info
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      setCurrentUser({
        role: userData.role,
        schoolId: userData.school?._id || userData.school,
      });
      
      // Set default tab based on user role
      if (userData.role === "student") {
        setSelectedRole("mentor");
      } else if (userData.role === "mentor") {
        setSelectedRole("student");
      } else {
        setSelectedRole("mentor");
      }
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, users, selectedRole, selectedSchool, currentUser]);

  // Reset school filter when superadmin role is selected
  useEffect(() => {
    if (selectedRole === "superadmin") {
      setSelectedSchool("all");
    }
  }, [selectedRole]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await getAvailableUsers();
      setUsers(response.users);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSchools = async (page: number, limit: number) => {
    try {
      const response = await schoolService.getAll({ page, limit });
      return response;
    } catch (error) {
      console.error("Error loading schools:", error);
      return { success: false, data: [], pagination: undefined };
    }
  };

  const {
    items: paginatedSchools,
    loading: schoolsLoading,
    hasMore: hasMoreSchools,
    loadMore: loadMoreSchools,
  } = usePaginatedSelect({
    fetchFunction: loadSchools,
    limit: 20,
  });

  const applyFilters = () => {
    let filtered = [...users];

    // Filter by role (always applied since we're using tabs)
    filtered = filtered.filter((user) => user.role === selectedRole);

    // Role-based restrictions for students, mentors, and school admins
    if (currentUser) {
      // If logged-in user is a student, only show mentors from their school
      if (currentUser.role === "student" && selectedRole === "mentor" && currentUser.schoolId) {
        filtered = filtered.filter((user) => user.school?._id === currentUser.schoolId);
      }
      
      // If logged-in user is a school mentor, only show students from their school
      if (currentUser.role === "mentor" && selectedRole === "student" && currentUser.schoolId) {
        filtered = filtered.filter((user) => user.school?._id === currentUser.schoolId);
      }

      // If logged-in user is a school admin, only show mentors from their assigned school
      if (currentUser.role === "schooladmin" && selectedRole === "mentor" && currentUser.schoolId) {
        filtered = filtered.filter((user) => user.school?._id === currentUser.schoolId);
      }
    }

    // Filter by school (only if role is not superadmin and user is not restricted by their role)
    if (selectedSchool !== "all" && selectedRole !== "superadmin") {
      // Don't apply school filter if current user is student or mentor (they're already restricted)
      if (currentUser && (currentUser.role === "student" || currentUser.role === "mentor" || currentUser.role === "schooladmin")) {
        // Already filtered above, don't apply additional filter
      } else {
        filtered = filtered.filter((user) => user.school?._id === selectedSchool);
      }
    }

    // Filter by search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.school?.name.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  };

  const resetFilters = () => {
    // Set default role based on current user
    if (currentUser) {
      if (currentUser.role === "student") {
        setSelectedRole("mentor");
      } else if (currentUser.role === "mentor") {
        setSelectedRole("student");
      } else {
        setSelectedRole("mentor");
      }
    } else {
      setSelectedRole("mentor");
    }
    setSelectedSchool("all");
    setSearchQuery("");
  };

  const handleSelectUser = (userId: string) => {
    onSelectUser(userId);
    setOpen(false);
    resetFilters();
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "superadmin":
        return <Shield className="h-4 w-4" />;
      case "leadmentor":
        return <Users className="h-4 w-4" />;
      case "schooladmin":
        return <BookOpen className="h-4 w-4" />;
      case "mentor":
        return <GraduationCap className="h-4 w-4" />;
      case "student":
        return <UserIcon className="h-4 w-4" />;
      default:
        return <UserIcon className="h-4 w-4" />;
    }
  };

  const getRoleCount = (role: string) => {
    return users.filter((user) => user.role === role).length;
  };

  const isTabVisible = (role: string) => {
    if (!currentUser) return true;
    
    // Students can only see mentor tab
    if (currentUser.role === "student") {
      return role === "mentor";
    }
    
    // School mentors can see all tabs
    if (currentUser.role === "mentor") {
      return true;
    }
    
    // For other roles (superadmin, leadmentor, schooladmin), hide student tab
    if (role === "student") {
      return currentUser.role === "mentor";
    }
    
    return true;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "superadmin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "leadmentor":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "schooladmin":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "mentor":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "student":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "superadmin":
        return "Super Admin";
      case "leadmentor":
        return "Lead Mentor";
      case "schooladmin":
        return "School Admin";
      case "mentor":
        return "School Mentor";
      case "student":
        return "Student";
      default:
        return role;
    }
  };

  const hasActiveFilters = selectedSchool !== "all" || searchQuery !== "";

  // Calculate visible tabs for scrollable layout
  // const visibleTabs = ["mentor", "student", "schooladmin", "leadmentor", "superadmin"].filter(isTabVisible);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 text-xs">
          <MessageSquarePlus className="h-3 w-3" />
          <span className="hidden sm:inline">New Message</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[95vh] w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw] p-3 sm:p-4 lg:p-6 flex flex-col">
        <DialogHeader className="mb-3 sm:mb-4 lg:mb-6">
          <DialogTitle className="text-base sm:text-lg lg:text-xl">Start New Conversation</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Select a role and find a user to start messaging with
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedRole} onValueChange={setSelectedRole} className="w-full flex-1 flex flex-col">
          <TabsList className="flex w-full mb-4 gap-1 overflow-x-auto scrollbar-hide">
            {isTabVisible("mentor") && (
              <TabsTrigger value="mentor" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm min-h-[48px] touch-manipulation px-3 sm:px-4 whitespace-nowrap flex-shrink-0 min-w-[120px]">
                {getRoleIcon("mentor")}
                <span className="hidden md:inline">School Mentor</span>
                <span className="hidden sm:inline md:hidden">School Mentor</span>
                <span className="sm:hidden">School Mentor</span>
                <Badge variant="secondary" className="ml-1 h-4 min-w-[16px] px-1 text-xs">
                  {getRoleCount("mentor")}
                </Badge>
              </TabsTrigger>
            )}
            {isTabVisible("student") && (
              <TabsTrigger value="student" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm min-h-[48px] touch-manipulation px-3 sm:px-4 whitespace-nowrap flex-shrink-0 min-w-[120px]">
                {getRoleIcon("student")}
                <span className="hidden md:inline">Student</span>
                <span className="hidden sm:inline md:hidden">Student</span>
                <span className="sm:hidden">Student</span>
                <Badge variant="secondary" className="ml-1 h-4 min-w-[16px] px-1 text-xs">
                  {getRoleCount("student")}
                </Badge>
              </TabsTrigger>
            )}
            {isTabVisible("schooladmin") && (
              <TabsTrigger value="schooladmin" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm min-h-[48px] touch-manipulation px-3 sm:px-4 whitespace-nowrap flex-shrink-0 min-w-[120px]">
                {getRoleIcon("schooladmin")}
                <span className="hidden md:inline">School Admin</span>
                <span className="hidden sm:inline md:hidden">Admin</span>
                <span className="sm:hidden">Admin</span>
                <Badge variant="secondary" className="ml-1 h-4 min-w-[16px] px-1 text-xs">
                  {getRoleCount("schooladmin")}
                </Badge>
              </TabsTrigger>
            )}
            {isTabVisible("leadmentor") && (
              <TabsTrigger value="leadmentor" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm min-h-[48px] touch-manipulation px-3 sm:px-4 whitespace-nowrap flex-shrink-0 min-w-[120px]">
                {getRoleIcon("leadmentor")}
                <span className="hidden md:inline">Lead Mentor</span>
                <span className="hidden sm:inline md:hidden">Lead</span>
                <span className="sm:hidden">Lead</span>
                <Badge variant="secondary" className="ml-1 h-4 min-w-[16px] px-1 text-xs">
                  {getRoleCount("leadmentor")}
                </Badge>
              </TabsTrigger>
            )}
            {isTabVisible("superadmin") && (
              <TabsTrigger value="superadmin" className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm min-h-[48px] touch-manipulation px-3 sm:px-4 whitespace-nowrap flex-shrink-0 min-w-[120px]">
                {getRoleIcon("superadmin")}
                <span className="hidden md:inline">Super Admin</span>
                <span className="hidden sm:inline md:hidden">Super</span>
                <span className="sm:hidden">Super</span>
                <Badge variant="secondary" className="ml-1 h-4 min-w-[16px] px-1 text-xs">
                  {getRoleCount("superadmin")}
                </Badge>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Filters Section */}
          <div className="space-y-3 mb-4">
            <div className="flex flex-col sm:flex-row items-start gap-3">
              {/* School filter - only show if role is not superadmin and logged-in user is not student/mentor */}
              {selectedRole !== "superadmin" && 
               currentUser && 
               currentUser.role !== "student" && 
               currentUser.role !== "mentor" && (
                <div className="w-full sm:flex-1 sm:min-w-[200px]">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Filter by School
                  </label>
                  <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="All Schools" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Schools</SelectItem>
                      {paginatedSchools.map((school) => (
                        <SelectItem key={school._id} value={school._id}>
                          {school.name} ({school.city})
                        </SelectItem>
                      ))}
                      {hasMoreSchools && (
                        <div
                          className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!schoolsLoading && hasMoreSchools) {
                              loadMoreSchools();
                            }
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <div className="flex items-center justify-center w-full py-2">
                            {schoolsLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              "Load More Schools"
                            )}
                          </div>
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Search */}
              <div className={cn(
                "w-full sm:flex-1 sm:min-w-[200px]", 
                (selectedRole === "superadmin" || 
                 !currentUser || 
                 currentUser.role === "student" || 
                 currentUser.role === "mentor") && "w-full"
              )}>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by name, email, or school..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10"
                  />
                </div>
              </div>

              {hasActiveFilters && (
                <div className="flex items-end w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSchool("all");
                      setSearchQuery("");
                    }}
                    className="h-10 w-full sm:w-auto"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
              )}
            </div>

            {/* Results count and info */}
            <div className="flex items-center justify-between text-sm px-1">
              <p className="text-muted-foreground">
                {filteredUsers.length} {getRoleLabel(selectedRole).toLowerCase()}
                {filteredUsers.length !== 1 ? "s" : ""} found
              </p>
              {currentUser && (currentUser.role === "student" || currentUser.role === "mentor") && (
                <p className="text-xs text-muted-foreground italic">
                  Showing users from your school only
                </p>
              )}
            </div>
          </div>

          {/* User List */}
          <TabsContent value={selectedRole} className="mt-0 flex-1 flex flex-col">
            <ScrollArea className="flex-1 pr-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <p className="text-sm text-muted-foreground">Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex items-center justify-center h-40">
                  <p className="text-sm text-muted-foreground">
                    {hasActiveFilters 
                      ? `No ${getRoleLabel(selectedRole).toLowerCase()}s match your filters` 
                      : `No ${getRoleLabel(selectedRole).toLowerCase()}s available`}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => handleSelectUser(user._id)}
                      className="p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors touch-manipulation min-h-[60px] flex items-center active:bg-accent/80"
                    >
                      <div className="flex items-center justify-between gap-3 w-full">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {user.name}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                          {user.school && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {user.school.name} • {user.school.city}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn("text-xs shrink-0", getRoleColor(user.role))}
                        >
                          {getRoleLabel(user.role)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default NewMessageDialog;

