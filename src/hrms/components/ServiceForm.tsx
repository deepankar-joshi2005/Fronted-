import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X } from "lucide-react";
import type { ServiceDetails, GradeWithSections } from "@/api/schoolService";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ServiceFormProps {
  serviceDetails: ServiceDetails | null | undefined;
  onChange: (serviceDetails: ServiceDetails | null) => void;
}


export default function ServiceForm({
  serviceDetails,
  onChange,
}: ServiceFormProps) {
  const [selectedGrades, setSelectedGrades] = useState<number[]>([]);

  // Initialize selectedGrades from existing serviceDetails
  useEffect(() => {
    if (serviceDetails?.grades && serviceDetails.grades.length > 0) {
      const grades = serviceDetails.grades.map(gradeData => gradeData.grade);
      setSelectedGrades(grades);
    }
  }, [serviceDetails]);

  const updateServiceDetails = (updates: Partial<ServiceDetails>) => {
    const current = serviceDetails || {
      serviceType: "",
      mentors: [],
      subjects: [],
      grades: [],
    };
    onChange({ ...current, ...updates });
  };


  const handleMentorSelect = (value: "School Mentor" | "ThinkPro Mentor") => {
    updateServiceDetails({ mentors: [value] });
  };

  const handleGradeChange = (grade: number, checked: boolean) => {
    let newSelectedGrades;
    if (checked) {
      newSelectedGrades = [...selectedGrades, grade].sort();
    } else {
      newSelectedGrades = selectedGrades.filter((g) => g !== grade);
    }
    setSelectedGrades(newSelectedGrades);

    // Update service details with grades that have sections
    const currentGrades = serviceDetails?.grades || [];
    let updatedGrades;
    
    if (checked) {
      // When adding a grade, initialize it with default section "A" if it doesn't exist
      const existingGrade = currentGrades.find((g) => g.grade === grade);
      if (existingGrade) {
        // Grade already exists, keep it
        updatedGrades = currentGrades.filter((g) =>
          newSelectedGrades.includes(g.grade)
        );
      } else {
        // Add new grade with default section "A"
        const otherGrades = currentGrades.filter((g) =>
          newSelectedGrades.includes(g.grade)
        );
        updatedGrades = [...otherGrades, { grade, sections: ["A"] }];
      }
    } else {
      // When removing a grade, filter it out
      updatedGrades = currentGrades.filter((g) =>
        newSelectedGrades.includes(g.grade)
      );
    }
    
    updateServiceDetails({ grades: updatedGrades });
  };

  const handleSelectAllGrades = () => {
    const allGrades = Array.from({ length: 10 }, (_, i) => i + 1);
    setSelectedGrades(allGrades);

    // Initialize grades with default section "A"
    const gradesWithSections = allGrades.map((grade) => ({
      grade,
      sections: ["A"],
    }));
    updateServiceDetails({ grades: gradesWithSections });
  };

  const handleDeselectAllGrades = () => {
    setSelectedGrades([]);
    updateServiceDetails({ grades: [] });
  };


  const addSectionToGrade = (grade: number) => {
    const currentGrades = serviceDetails?.grades || [];
    const gradeIndex = currentGrades.findIndex((g) => g.grade === grade);

    if (gradeIndex >= 0) {
      const updatedGrades = [...currentGrades];
      updatedGrades[gradeIndex].sections.push("");
      updateServiceDetails({ grades: updatedGrades });
    } else {
      // Add new grade with sections - this should not happen if grade is selected
      // but if it does, add it with an empty section
      const newGrade: GradeWithSections = { grade, sections: [""] };
      updateServiceDetails({ grades: [...currentGrades, newGrade] });
    }
  };

  const updateSectionName = (
    grade: number,
    sectionIndex: number,
    value: string
  ) => {
    const currentGrades = serviceDetails?.grades || [];
    const gradeIndex = currentGrades.findIndex((g) => g.grade === grade);

    if (gradeIndex >= 0) {
      const updatedGrades = [...currentGrades];
      updatedGrades[gradeIndex].sections[sectionIndex] = value;
      updateServiceDetails({ grades: updatedGrades });
    }
  };

  const removeSectionFromGrade = (grade: number, sectionIndex: number) => {
    const currentGrades = serviceDetails?.grades || [];
    const gradeIndex = currentGrades.findIndex((g) => g.grade === grade);

    if (gradeIndex >= 0) {
      const updatedGrades = [...currentGrades];
      updatedGrades[gradeIndex].sections.splice(sectionIndex, 1);

      // If no sections left, remove the grade and update selected grades
      if (updatedGrades[gradeIndex].sections.length === 0) {
        updatedGrades.splice(gradeIndex, 1);
        setSelectedGrades(selectedGrades.filter((g) => g !== grade));
      }

      updateServiceDetails({ grades: updatedGrades });
    }
  };

  const getGradeSections = (grade: number) => {
    const currentGrades = serviceDetails?.grades || [];
    const gradeData = currentGrades.find((g) => g.grade === grade);
    return gradeData ? gradeData.sections : [];
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Service Details</h3>

      {/* Service Type */}
      {/* <div className="space-y-2">
        <Label htmlFor="serviceType">Service Type</Label>
        <Input
          id="serviceType"
          value={serviceDetails?.serviceType || ""}
          onChange={(e) =>
            updateServiceDetails({ serviceType: e.target.value })
          }
          placeholder="Enter service type"
        />
      </div> */}

      {/* Mentor Selection */}
      <div className="space-y-3">
        <Label>Mentor Type *</Label>
        <RadioGroup
          value={serviceDetails?.mentors?.[0] || ""}
          onValueChange={(v) => handleMentorSelect(v as "School Mentor" | "ThinkPro Mentor")}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem id="school-mentor" value="School Mentor" />
            <Label htmlFor="school-mentor">School Mentor</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem id="thinker-mentor" value="ThinkPro Mentor" />
            <Label htmlFor="thinker-mentor">ThinkPro Mentor</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Grade Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Select Grades *</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAllGrades}
              className="text-xs"
            >
              Select All
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDeselectAllGrades}
              className="text-xs"
            >
              Deselect All
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((grade) => (
            <div key={grade} className="flex items-center space-x-2">
              <Checkbox
                id={`grade-${grade}`}
                checked={selectedGrades.includes(grade)}
                onCheckedChange={(checked) =>
                  handleGradeChange(grade, checked as boolean)
                }
              />
              <Label htmlFor={`grade-${grade}`} className="text-sm">
                Grade {grade}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Subject Selection */}
      {/* <div className="space-y-3"> */}
        {/* <Label>Subjects *</Label> */}
        {/* <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {COMMON_SUBJECTS.map((subject) => (
            <div key={subject} className="flex items-center space-x-2">
              <Checkbox
                id={`subject-${subject}`}
                checked={serviceDetails?.subjects.includes(subject) || false}
                onCheckedChange={(checked) =>
                  handleSubjectChange(subject, checked as boolean)
                }
              />
              <Label htmlFor={`subject-${subject}`} className="text-sm">
                {subject}
              </Label>
            </div>
          ))}
        </div> */}

        {/* Custom Subject Input */}
        {/* <div className="flex gap-2">
          <Input
            value={customSubject}
            onChange={(e) => setCustomSubject(e.target.value)}
            placeholder="Add custom subject"
            onKeyPress={(e) => e.key === "Enter" && addCustomSubject()}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCustomSubject}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div> */}

        {/* Selected Subjects */}
        {/* {serviceDetails?.subjects && serviceDetails.subjects.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Selected Subjects:</Label>
            <div className="flex flex-wrap gap-2">
              {serviceDetails.subjects.map((subject) => (
                <div
                  key={subject}
                  className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                >
                  {subject}
                  <button
                    type="button"
                    onClick={() => removeSubject(subject)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )} */}
      {/* </div> */}

      {/* Sections for Selected Grades */}
      {selectedGrades.length > 0 && (
        <div className="space-y-4">
          <Label>Create Sections for Selected Grades *</Label>
          <div className="space-y-4">
            {selectedGrades.map((grade) => {
              const sections = getGradeSections(grade);
              return (
                <Card key={grade} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Grade {grade}</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addSectionToGrade(grade)}
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Add Section
                      </Button>
                    </div>

                    {sections.length > 0 ? (
                      <div className="space-y-2">
                        {sections.map((sectionName, sectionIndex) => (
                          <div
                            key={sectionIndex}
                            className="flex items-center gap-2"
                          >
                            <Input
                              value={sectionName}
                              onChange={(e) =>
                                updateSectionName(
                                  grade,
                                  sectionIndex,
                                  e.target.value
                                )
                              }
                              placeholder="A, B, C"
                              className="flex-1"
                            />
                            {sections.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  removeSectionFromGrade(grade, sectionIndex)
                                }
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-2 text-gray-500 text-sm">
                        No sections added yet. Click "Add Section" to create
                        sections for Grade {grade}.
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {selectedGrades.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <p>Please select grades first to create sections.</p>
        </div>
      )}
    </div>
  );
}
