import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, Search, Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  sessionProgressService,
  type School,
} from "@/api/sessionProgressService";
import { schoolService, type AvailableGrade } from "@/api/schoolService";
import { mentorService, type Mentor } from "@/api/mentorService";
import { leadMentorService } from "@/api/leadMentorService";
import { schoolAdminService } from "@/api/schoolAdminService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { utils as XLSXUtils, writeFile as writeXlsx } from "xlsx";

interface SessionProgressViewerProps {
  title?: string;
  description?: string;
}

// New interface for the comprehensive session data
interface SessionProgressData {
  grade: number;
  section: string;
  sessionId: string;
  sessionName: string;
  displayName: string;
  description?: string;
  status: string;
  notes?: string;
  updatedAt?: string | null;
  // Allow dynamic properties for section-specific data
  [key: string]: any;
}

interface GradeSectionData {
  grade: number;
  sections: string[];
  sessions: SessionProgressData[];
}

export default function SessionProgressViewer({
  title = "Session Progress Overview",
  description = "Monitor and manage session completion progress for all grades and sections",
}: SessionProgressViewerProps) {
  const { user } = useAuth();
  const [gradeSectionData, setGradeSectionData] = useState<GradeSectionData[]>([]);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [availableSchools, setAvailableSchools] = useState<School[]>([]);
  const [availableMentors, setAvailableMentors] = useState<Mentor[]>([]);
  const [selectedMentorId, setSelectedMentorId] = useState<string>("");
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [schoolAdminAssignedSchoolId, setSchoolAdminAssignedSchoolId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Loading states for filters
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    loadAvailableMentors();
  }, []);

  // Load schools when mentor changes
  useEffect(() => {
    if (selectedMentorId) {
      loadMentorSchools(selectedMentorId);
    } else {
      setAvailableSchools([]);
      setSelectedSchoolId("");
      setGradeSectionData([]);
    }
  }, [selectedMentorId]);

  // Load school service details and all session data when school changes
  useEffect(() => {
    let isCancelled = false;

    const loadAllSessionData = async (
      mentorId: string,
      schoolId: string,
      grades: AvailableGrade[]
    ) => {
      try {
        const allGradeSectionData: GradeSectionData[] = [];

        // Sort grades in ascending order - ONLY use grades from school's service details
        const sortedGrades = [...grades].sort((a, b) => a.grade - b.grade);

        console.log("Loading session data for grades:", sortedGrades.map(g => g.grade));

        for (const gradeData of sortedGrades) {
          // Check if component is still mounted
          if (isCancelled) {
            console.log("Component unmounted, cancelling session data load");
            return;
          }

          const gradeSections: string[] = gradeData.sections || [];
          console.log(`Loading data for Grade ${gradeData.grade} with sections:`, gradeSections);

          // Only proceed if this grade has sections
          if (gradeSections.length === 0) {
            console.log(`Skipping Grade ${gradeData.grade} - no sections available`);
            continue;
          }

          const gradeSessions: SessionProgressData[] = [];

          // Load session data for each section in this grade
          for (const section of gradeSections) {
            try {
              console.log(`Loading sessions for Grade ${gradeData.grade}, Section ${section}`);
              
              // Use different service method based on user role
              let progressData;
              if (user?.role === 'schooladmin') {
                progressData = await sessionProgressService.getSchoolAdminSessionProgress(
                  mentorId,
                  schoolId,
                  section,
                  gradeData.grade.toString()
                );
              } else {
                progressData = await sessionProgressService.getLeadMentorSessionProgress(
                  mentorId,
                  schoolId,
                  section,
                  gradeData.grade.toString()
                );
              }

              // Check if component is still mounted
              if (isCancelled) {
                console.log("Component unmounted, cancelling session data load");
                return;
              }

              const sessions = progressData.sessions || [];
              console.log(`Found ${sessions.length} sessions for Grade ${gradeData.grade}, Section ${section}`);
              
              // Transform session data to include grade and section info
              const transformedSessions = sessions.map((session: any) => ({
                grade: gradeData.grade,
                section: section,
                sessionId: session.sessionId,
                sessionName: session.sessionName,
                displayName: session.displayName,
                description: session.description,
                status: session.status || "Pending",
                notes: session.notes || "",
                updatedAt: session.updatedAt || null
              }));

              gradeSessions.push(...transformedSessions);
            } catch (error) {
              console.error(`Error loading sessions for grade ${gradeData.grade}, section ${section}:`, error);
            }
          }

          // Only create grade data if we have sessions
          if (gradeSessions.length > 0) {
            // Group sessions by display name to preserve sessions with different display names
            const sessionGroups = gradeSessions.reduce((groups, session) => {
              const key = session.displayName;
              if (!groups[key]) {
                groups[key] = [];
              }
              groups[key].push(session);
              return groups;
            }, {} as Record<string, SessionProgressData[]>);

            // Create session entries
            const sessionEntries: SessionProgressData[] = [];
            
            for (const [, sectionSessions] of Object.entries(sessionGroups)) {
              const firstSession = sectionSessions[0];
              const sessionEntry: SessionProgressData = {
                grade: gradeData.grade,
                section: "ALL", // This represents the session across all sections
                sessionId: firstSession.sessionId,
                sessionName: firstSession.sessionName,
                displayName: firstSession.displayName, // Backend already provides the formatted display name
                description: firstSession.description,
                status: "Mixed", // Will be determined by section statuses
                notes: "",
                updatedAt: firstSession.updatedAt || null
              };
              
              // Add section-specific data
              for (const sectionSession of sectionSessions) {
                sessionEntry[`${sectionSession.section}_status`] = sectionSession.status;
                sessionEntry[`${sectionSession.section}_notes`] = sectionSession.notes;
                sessionEntry[`${sectionSession.section}_updatedAt`] = sectionSession.updatedAt || null;
              }
              
              sessionEntries.push(sessionEntry);
            }

            console.log(`Created ${sessionEntries.length} session entries for Grade ${gradeData.grade}`);

            allGradeSectionData.push({
              grade: gradeData.grade,
              sections: gradeSections,
              sessions: sessionEntries
            });
          } else {
            console.log(`No sessions found for Grade ${gradeData.grade} - skipping`);
          }
        }

        // Only update state if component is still mounted
        if (!isCancelled) {
          console.log("Final grade section data:", allGradeSectionData.map(g => ({ grade: g.grade, sessionCount: g.sessions.length })));
          setGradeSectionData(allGradeSectionData);
        }
      } catch (error) {
        console.error("Error loading all session data:", error);
        if (!isCancelled) {
          toast.error("Failed to load session data");
          setGradeSectionData([]);
        }
      } finally {
        // No loading state needed
      }
    };

    const fetchSchoolServiceDetails = async (schoolId: string) => {
      try {
        setLoadingSessions(true);
        setGradeSectionData([]); // Clear previous data immediately
        
        const response = await schoolService.getServiceDetails(schoolId);
        if (response.success && !isCancelled) {
          // Load all session data for all grades and sections
          if (response.data.grades && response.data.grades.length > 0) {
            await loadAllSessionData(selectedMentorId, schoolId, response.data.grades);
          }
        }
      } catch (error) {
        console.error("Error fetching school service details:", error);
        if (!isCancelled) {
          setGradeSectionData([]);
        }
      } finally {
        if (!isCancelled) {
          setLoadingSessions(false);
        }
      }
    };

    if (selectedSchoolId && selectedMentorId) {
      fetchSchoolServiceDetails(selectedSchoolId);
    } else {
      setGradeSectionData([]);
    }

    // Cleanup function
    return () => {
      isCancelled = true;
    };
  }, [selectedSchoolId, selectedMentorId]);

  const loadAvailableMentors = async () => {
    try {
      setLoadingMentors(true);
      
      // Use different service based on user role
      if (user?.role === 'schooladmin') {
        const response = await schoolAdminService.getMentors();
        if (response.success) {
          // Map mentors to include addedBy property for compatibility
          const mappedMentors = response.data.mentors.map((mentor: any) => ({
            ...mentor,
            addedBy: {
              _id: mentor.user._id,
              name: mentor.user.name,
              email: mentor.user.email
            }
          }));
          setAvailableMentors(mappedMentors);
          // Capture the school admin's assigned school id for later intersection
          const adminSchoolId = response.data?.schoolAdmin?.assignedSchool?._id || "";
          setSchoolAdminAssignedSchoolId(adminSchoolId);
          // Auto-select first mentor on initial load
          if (mappedMentors.length > 0) {
            setSelectedMentorId(mappedMentors[0]._id);
          }
        }
      } else if (user?.role === 'leadmentor') {
        // For lead mentor, restrict mentors to assigned schools unless global access
        const [mentorsRes, leadRes] = await Promise.all([
          mentorService.getAll(),
          user.leadMentorId
            ? leadMentorService.getById(user.leadMentorId)
            : leadMentorService.getMySchools().then((r) => ({ success: true, data: { assignedSchools: r.data, hasAccessToAllSchools: false } as any }))
        ]);

        if (mentorsRes.success) {
          let mentors = mentorsRes.data;

          // Determine access scope
          let hasAllAccess = false;
          let allowedSchoolIds: string[] = [];

          if ((leadRes as any).success) {
            const leadData: any = (leadRes as any).data;
            if (Array.isArray(leadData)) {
              // Fallback shape shouldn't happen here
              allowedSchoolIds = [];
            } else if (leadData?.hasAccessToAllSchools) {
              hasAllAccess = true;
            } else if (Array.isArray(leadData?.assignedSchools)) {
              allowedSchoolIds = leadData.assignedSchools.map((s: any) => s._id);
            } else if (Array.isArray(leadData)) {
              allowedSchoolIds = leadData.map((s: any) => s._id);
            }
          }

          if (!hasAllAccess && allowedSchoolIds.length > 0) {
            mentors = mentors.filter((m) =>
              Array.isArray(m.assignedSchools) &&
              m.assignedSchools.some((s) => allowedSchoolIds.includes(s._id))
            );
          }

          setAvailableMentors(mentors);
          if (mentors.length > 0) {
            setSelectedMentorId(mentors[0]._id);
          } else {
            setSelectedMentorId("");
          }
        }
      } else {
        // For superadmin and other roles, show all mentors
        const response = await mentorService.getAll();
        if (response.success) {
          setAvailableMentors(response.data);
          if (response.data.length > 0) {
            setSelectedMentorId(response.data[0]._id);
          }
        }
      }
    } catch (error) {
      console.error("Error loading mentors:", error);
      toast.error("Failed to load mentors");
    } finally {
      setLoadingMentors(false);
    }
  };

  const loadMentorSchools = async (mentorId: string) => {
    try {
      setLoadingSchools(true);
      
      if (user?.role === 'schooladmin') {
        // For school admin, get schools from the selected mentor
        const selectedMentor: any = availableMentors.find(mentor => mentor._id === mentorId);
        const mentorSchools: School[] = selectedMentor
          ? (Array.isArray((selectedMentor as any).assignedSchools)
              ? (selectedMentor as any).assignedSchools
              : selectedMentor.assignedSchool
              ? [selectedMentor.assignedSchool]
              : [])
          : [];

        // Restrict to the school admin's assigned school
        const schools: School[] = schoolAdminAssignedSchoolId
          ? mentorSchools.filter((s) => s._id === schoolAdminAssignedSchoolId)
          : mentorSchools;

        setAvailableSchools(schools);
        setSelectedSchoolId(schools[0]?._id || "");
      } else if (user?.role === 'leadmentor') {
        // For lead mentor, restrict schools to intersection with their assigned schools (unless global access)
        const [mentorRes, leadRes] = await Promise.all([
          mentorService.getById(mentorId),
          user.leadMentorId
            ? leadMentorService.getById(user.leadMentorId)
            : leadMentorService.getMySchools().then((r) => ({ success: true, data: { assignedSchools: r.data, hasAccessToAllSchools: false } as any }))
        ]);

        if (mentorRes.success) {
          const mentor: any = mentorRes.data;
          const mentorSchools: School[] = Array.isArray(mentor.assignedSchools)
            ? mentor.assignedSchools
            : mentor.assignedSchool
            ? [mentor.assignedSchool]
            : [];

          let allowedSchools: School[] = mentorSchools;
          if ((leadRes as any).success) {
            const leadData: any = (leadRes as any).data;
            if (leadData?.hasAccessToAllSchools) {
              // keep mentorSchools as is
            } else {
              const leadSchoolIds = Array.isArray(leadData?.assignedSchools)
                ? leadData.assignedSchools.map((s: any) => s._id)
                : Array.isArray(leadData)
                ? leadData.map((s: any) => s._id)
                : [];
              allowedSchools = mentorSchools.filter((s) => leadSchoolIds.includes(s._id));
            }
          }

          setAvailableSchools(allowedSchools);
          setSelectedSchoolId(allowedSchools[0]?._id || "");
        }
      } else {
        // For superadmin and other roles, show mentor's assigned schools
        const response = await mentorService.getById(mentorId);
        if (response.success) {
          const mentor: any = response.data;
          const schools: School[] = Array.isArray(mentor.assignedSchools)
            ? mentor.assignedSchools
            : mentor.assignedSchool
            ? [mentor.assignedSchool]
            : [];

          setAvailableSchools(schools);
          setSelectedSchoolId(schools[0]?._id || "");
        }
      }
    } catch (error) {
      console.error("Error loading mentor schools:", error);
      toast.error("Failed to load mentor schools");
    } finally {
      setLoadingSchools(false);
    }
  };


  // Filter sessions based on search term
  const filteredGradeSectionData = gradeSectionData.map(gradeData => ({
    ...gradeData,
    sessions: gradeData.sessions.filter(session =>
      session.sessionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (session.description &&
        session.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })).filter(gradeData => gradeData.sessions.length > 0);

  // Calculate session status counts across all grades
  const allSessions = gradeSectionData.flatMap(gradeData => gradeData.sessions);
  const sessionCounts = allSessions.reduce((counts, session) => {
    const status = session.status || "Pending";
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  const totalSessions = allSessions.length;
  const pendingCount = sessionCounts["Pending"] || 0;
  const inProgressCount = sessionCounts["In Progress"] || 0;
  const completedCount = sessionCounts["Completed"] || 0;

  // Export to Excel functionality
  const exportToExcel = () => {
    try {
      // Create workbook data
      const workbookData: any[] = [];
      
      // Add header information
      const selectedSchool = availableSchools.find(s => s._id === selectedSchoolId);
      const selectedMentor = availableMentors.find(m => m._id === selectedMentorId);
      
      workbookData.push(
        ["School", selectedSchool?.name || ""],
        ["Mentor", selectedMentor?.user.name || ""],
        ["Grade", "Filter"],
        [""], // Empty row
      );

      // Add data for each grade
      gradeSectionData.forEach(gradeData => {
        // Add grade header
        workbookData.push([`Grade ${gradeData.grade}`, ""]);
        
              // Add section headers (include Updated At for each section)
              const headers = [
                "Session",
                ...gradeData.sections.map(section => `${section} Status`),
                ...gradeData.sections.map(section => `${section} Updated At`),
                ...gradeData.sections.map(section => `${section} Notes`),
              ];
        workbookData.push(headers);
        
        // Add session data
        gradeData.sessions.forEach(session => {
          const row = [session.displayName];
          
          // Add status for each section
          gradeData.sections.forEach(section => {
            const status = session[`${section}_status`] || "Pending";
            row.push(status);
          });
          
          // Add updated at for each section - compact format to avoid Excel ####
          gradeData.sections.forEach(section => {
            const updatedAt = session[`${section}_updatedAt`] || session.updatedAt || "";
            const formatted = (() => {
              if (!updatedAt) return "";
              const d = new Date(updatedAt);
              if (isNaN(d.getTime())) return "";
              const pad = (n: number) => n.toString().padStart(2, '0');
              const yyyy = d.getFullYear();
              const mm = pad(d.getMonth() + 1);
              const dd = pad(d.getDate());
              const hh = pad(d.getHours());
              const mi = pad(d.getMinutes());
              return `${yyyy}-${mm}-${dd} ${hh}:${mi}`; // compact 24h format
            })();
            row.push(formatted);
          });
          
          // Add notes for each section
          gradeData.sections.forEach(section => {
            const notes = session[`${section}_notes`] || "";
            row.push(notes);
          });
          
          workbookData.push(row);
        });
        
        workbookData.push([""]); // Empty row between grades
      });

      // Build XLSX worksheet from AoA
      const ws = XLSXUtils.aoa_to_sheet(workbookData);

      // Compute dynamic column widths to avoid #### in Excel
      const colCount = workbookData.reduce((max, row) => Math.max(max, row.length), 0);
      const colWidths = new Array(colCount).fill(0).map((_, colIdx) => {
        let maxLen = 0;
        for (const row of workbookData) {
          const cell = row[colIdx];
          const str = cell == null ? "" : String(cell);
          if (str.length > maxLen) maxLen = str.length;
        }
        const min = 12; // minimum width chars
        const max = 40; // cap overly long
        const wch = Math.min(Math.max(maxLen + 2, min), max);
        return { wch };
      });
      (ws as any)["!cols"] = colWidths;

      // Create workbook and save as .xlsx
      const wb = XLSXUtils.book_new();
      XLSXUtils.book_append_sheet(wb, ws, "Session Progress");
      writeXlsx(
        wb,
        `session-progress-${selectedSchool?.name?.replace(/\s+/g, '-') || 'school'}-${new Date().toISOString().split('T')[0]}.xlsx`
      );
      
      toast.success("Session progress exported successfully");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export session progress");
    }
  };

  if (loadingSessions) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const filtersCompleted = selectedMentorId && selectedSchoolId;

  return (
    <div className="p-4 space-y-3 max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-gray-600 text-xs">{description}</p>
        </div>
      </div>

      {/* Mentor and School Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Mentor Selection */}
        <div>
          <Label htmlFor="mentor-select" className="text-xs font-medium">
            School Mentor
          </Label>
          <Select
            value={selectedMentorId}
            onValueChange={(value) => {
              setSelectedMentorId(value);
            }}
            disabled={loadingMentors}
          >
            <SelectTrigger className="w-full h-8">
              <SelectValue
                placeholder={
                  loadingMentors ? "Loading..." : "Select school mentor"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {availableMentors.map((mentor) => (
                <SelectItem key={mentor._id} value={mentor._id}>
                  {mentor.user.name} - {mentor.user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* School Selection */}
        <div>
          <Label htmlFor="school-select" className="text-xs font-medium">
            School
          </Label>
          <Select
            value={selectedSchoolId}
            onValueChange={(value) => {
              setSelectedSchoolId(value);
            }}
            disabled={loadingSchools || availableSchools.length === 0}
          >
            <SelectTrigger className="w-full h-8">
              <SelectValue
                placeholder={loadingSchools ? "Loading..." : "Select school"}
              />
            </SelectTrigger>
            <SelectContent>
              {availableSchools.map((school) => (
                <SelectItem key={school._id} value={school._id}>
                  {school.name} - {school.city}, {school.state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Show message when filters are not complete */}
      {!filtersCompleted && (
        <Alert>
          <AlertDescription>
            Please select Mentor and School to view session progress for all grades and sections.
          </AlertDescription>
        </Alert>
      )}

      {/* Show loading state when sessions are being loaded */}
      {filtersCompleted && loadingSessions && (
        <Alert>
          <AlertDescription className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading session data for all grades and sections...
          </AlertDescription>
        </Alert>
      )}

      {/* Show message when no data is available */}
      {filtersCompleted && gradeSectionData.length === 0 && !loadingSessions && (
        <Alert>
          <AlertDescription>
            No session data found for the selected school. Please try selecting
            a different school or contact your administrator if sessions should
            be available.
          </AlertDescription>
        </Alert>
      )}

      {/* Session Summary Report */}
      {filtersCompleted && allSessions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-lg font-bold text-gray-700">
              {totalSessions}
            </div>
            <div className="text-xs text-gray-600">Total Sessions</div>
          </div>
          <div className="text-center p-2 bg-gray-100 rounded">
            <div className="text-lg font-bold text-gray-600">
              {pendingCount}
            </div>
            <div className="text-xs text-gray-600">Pending</div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="text-lg font-bold text-blue-600">
              {inProgressCount}
            </div>
            <div className="text-xs text-blue-600">In Progress</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded">
            <div className="text-lg font-bold text-green-600">
              {completedCount}
            </div>
            <div className="text-xs text-green-600">Completed</div>
          </div>
        </div>
      )}

      {/* Comprehensive Sessions Table */}
      {filtersCompleted && gradeSectionData.length > 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-card p-3">
          <div className="p-0">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <BookOpen className="h-4 w-4" />
                Session Progress by Grade and Section
              </div>

              <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 justify-between sm:justify-end">
                {/* Search Input */}
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                  <Input
                    placeholder="Search sessions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 h-9 sm:h-7 text-xs"
                  />
                </div>

                {/* Export Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToExcel()}
                  className="h-9 sm:h-7 text-xs w-full sm:w-auto"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export Excel
                </Button>
              </div>
            </div>
          </div>
          <div className="p-0 mt-3">
            <div className="space-y-6">
              {filteredGradeSectionData.map((gradeData) => (
                <div key={gradeData.grade} className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Grade {gradeData.grade}
                  </h3>
                  <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="h-8">
                          <TableHead className="w-[80px] text-xs font-medium">Session</TableHead>
                          {gradeData.sections.map((section) => (
                            <TableHead key={section} className="text-xs font-medium text-center min-w-[120px]">
                              {section}
                            </TableHead>
                          ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                        {gradeData.sessions.map((session) => (
                          <TableRow key={`${session.grade}-${session.sessionId}`} className="h-10">
                      <TableCell className="font-medium text-xs">
                              <div className="font-semibold">
                            {session.displayName}
                          </div>
                              {session.description && (
                                <div className="text-gray-500 text-[10px] mt-1">
                                  {session.description}
                        </div>
                              )}
                      </TableCell>
                            {gradeData.sections.map((section) => {
                              const sectionStatus = session[`${section}_status`] || "Pending";
                              const sectionNotes = session[`${section}_notes`] || "";
                              const sectionUpdatedAt = session[`${section}_updatedAt`] || session.updatedAt || null;
                              const isExpanded = !!expandedNotes[`${session.sessionId}-${section}`];
                              const isLongNote = sectionNotes.length > 50;

                              return (
                                <TableCell key={section} className="text-center">
                                  <div className="space-y-1">
                                    {/* Status Badge */}
                                    <div className="flex justify-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          sectionStatus === "Completed"
                                ? "bg-green-100 text-green-800 border border-green-200"
                                            : sectionStatus === "In Progress"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : "bg-gray-100 text-gray-800 border border-gray-200"
                            }`}
                          >
                                        {sectionStatus}
                          </span>
                        </div>
                                    
                                    {/* Last Updated Date */}
                                    {sectionUpdatedAt && (
                                      <div className="text-[9px] text-gray-500">
                                        {new Date(sectionUpdatedAt).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric'
                                        })}
                                      </div>
                                    )}
                                    
                                    {/* Notes */}
                                    {sectionNotes && (
                                      <div className="text-[10px] text-gray-600 max-w-[100px] mx-auto">
                            <div
                              className={
                                !isExpanded
                                              ? "max-h-6 overflow-hidden"
                                  : undefined
                              }
                            >
                                          {sectionNotes}
                            </div>
                            {isLongNote && (
                              <button
                                type="button"
                                            className="text-blue-600 hover:underline text-[9px]"
                                onClick={() =>
                                  setExpandedNotes((prev) => ({
                                    ...prev,
                                                [`${session.sessionId}-${section}`]: !isExpanded,
                                  }))
                                }
                              >
                                            {isExpanded ? "Less" : "More"}
                              </button>
                            )}
                          </div>
                        )}
                                  </div>
                      </TableCell>
                  );
                })}
                          </TableRow>
                        ))}
              </TableBody>
            </Table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
