import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import DraggableJobBox from './DraggableJobBox';
import './EmployeeStyles.css';
import './Scheduling.css';
import DateSchedule from './DateSchedule';

const Scheduling = () => {
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(true);
    // Add ref for tracking move operations to prevent multiple calls
    const isMoving = useRef(false);
    // Add state to track which project box is being dragged
    const [draggedBoxId, setDraggedBoxId] = useState(null);
    // Add state to track the hover target for project boxes
    const [hoverTargetIndex, setHoverTargetIndex] = useState(null);
    
    // Replace direct projects access with date-based lookup
    const projectsByDate = useSelector((state) => state.projectReducer.projectsByDate);
    const selectedDate = useSelector((state) => state.scheduleReducer.selectedDate);
    const isEditable = useSelector((state) => state.scheduleReducer.isEditable);
    const highlightedEmployees = useSelector((state) => state.employeeReducer.highlightedEmployees);
    const employeesByDate = useSelector((state) => state.scheduleReducer.employeesByDate);
    
    // Get projects for the current selected date
    const projects = useMemo(() => {
        return projectsByDate[selectedDate] || [];
    }, [projectsByDate, selectedDate]);

    // Keep existing sort logic
    const sortedProjects = useMemo(() => {
        if (!projects) return [];
        
        return [...projects].sort((a, b) => {
            const aHasEmployees = (a.employees?.length || 0) > 0;
            const bHasEmployees = (b.employees?.length || 0) > 0;
            
            if (aHasEmployees !== bHasEmployees) {
                return bHasEmployees ? 1 : -1;
            }
            
            const orderA = a.display_order ?? Infinity;
            const orderB = b.display_order ?? Infinity;
            return orderA - orderB;
        });
    }, [projects]);

    const totalAssignedEmployees = useMemo(() => {
        return projects.reduce((total, project) => total + (project.employees?.length || 0), 0);
    }, [projects]);

    // Keep existing initialization
    useEffect(() => {
        const initializeSchedule = async () => {
            setIsLoading(true);
            try {
                await dispatch({ type: 'INITIALIZE_SCHEDULE' });
            } catch (error) {
                console.error('Error initializing schedule:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeSchedule();
    }, [dispatch]);

    // Keep existing data fetching
    useEffect(() => {
        const fetchData = async () => {
            if (!selectedDate) return;
            
            setIsLoading(true);
            try {
                await Promise.all([
                    dispatch({ 
                        type: 'FETCH_PROJECTS_WITH_EMPLOYEES', 
                        payload: { date: selectedDate }
                    }),
                    dispatch({ 
                        type: 'FETCH_EMPLOYEES', 
                        payload: { date: selectedDate }
                    }),
                    dispatch({
                        type: 'FETCH_UNIONS_WITH_EMPLOYEES',
                        payload: { date: selectedDate }
                    })
                ]);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [dispatch, selectedDate]);

    // Keep existing finalize handler
    const handleFinalize = useCallback(() => {
        if (!window.confirm('Are you sure you want to finalize this schedule?')) {
            return;
        }
        dispatch({
            type: 'FINALIZE_SCHEDULE',
            payload: { date: selectedDate }
        });
    }, [dispatch, selectedDate]);

    // Updated moveEmployee with debouncing to prevent multiple calls
    const moveEmployee = useCallback(({
        employeeId,
        targetProjectId,
        sourceLocation,
        dropIndex,
        date
    }) => {
        if (!isEditable) {
            console.warn('Cannot modify past dates');
            return;
        }

        // Prevent multiple calls in quick succession
        if (isMoving.current) return;
        isMoving.current = true;
        
        // Clear the debounce after a short delay
        setTimeout(() => {
            isMoving.current = false;
        }, 300);

        console.log('moveEmployee called with:', {
            employeeId,
            targetProjectId,
            sourceLocation,
            dropIndex,
            date: selectedDate
        });

        dispatch({
            type: 'MOVE_EMPLOYEE',
            payload: {
                employeeId,
                targetProjectId,
                sourceLocation,
                dropIndex,
                date: selectedDate || date
            },
        });
    }, [dispatch, selectedDate, isEditable]);

    // Completely rewritten moveJob function for more reliable project box reordering
    const moveJob = useCallback(async (dragIndex, hoverIndex) => {
        if (!isEditable || dragIndex === hoverIndex) {
            return;
        }
        
        // Update hover target index for visual indicator
        setHoverTargetIndex(hoverIndex);
        
        // Get the projects from the current state
        const currentProjects = [...sortedProjects];
        const draggedProject = currentProjects[dragIndex];
        
        if (!draggedProject) {
            console.warn('No project found at dragIndex:', dragIndex);
            return;
        }
        
        try {
            // Update the dragged box ID for styling
            setDraggedBoxId(draggedProject.job_id || draggedProject.id);
            
            // Make a copy of the projects array
            const updatedProjects = [...currentProjects];
            
            // Remove the dragged project
            updatedProjects.splice(dragIndex, 1);
            
            // Insert at the new position
            updatedProjects.splice(hoverIndex, 0, draggedProject);
            
            // Update display orders for all projects
            const projectsWithOrder = updatedProjects.map((project, index) => ({
                ...project,
                display_order: index
            }));
            
            // Update Redux immediately for a responsive UI
            dispatch({
                type: 'REORDER_PROJECTS',
                payload: {
                    sourceIndex: dragIndex,
                    targetIndex: hoverIndex,
                    date: selectedDate,
                    projects: projectsWithOrder
                }
            });
            
            // Prepare ordered IDs for the backend
            const orderedProjectIds = projectsWithOrder.map(p => p.job_id || p.id);
            
            // Update the backend
            await axios.put('/api/project/updateProjectOrder', {
                orderedProjectIds,
                date: selectedDate
            });
            
            console.log('Successfully updated project order:', {
                dragIndex,
                hoverIndex,
                selectedDate
            });
            
        } catch (error) {
            console.error('Error in moveJob:', error);
            
            // Revert on error by refreshing from server
            dispatch({ 
                type: 'FETCH_PROJECTS_WITH_EMPLOYEES',
                payload: { date: selectedDate }
            });
        } finally {
            // Clear the dragged box ID and hover target
            setDraggedBoxId(null);
            setHoverTargetIndex(null);
        }
    }, [dispatch, sortedProjects, selectedDate, isEditable]);
    
    // Handle drag end for cleanup
    const handleDragEnd = useCallback(() => {
        setDraggedBoxId(null);
        setHoverTargetIndex(null);
    }, []);

    // Keep existing highlight toggle
    const toggleHighlight = useCallback(async (employeeId, isHighlighted) => {
        if (!isEditable) return;

        try {
            await axios.put(`/api/schedule/${selectedDate}/${employeeId}/highlight`, {
                isHighlighted
            });

            dispatch({
                type: 'SET_HIGHLIGHTED_EMPLOYEE',
                payload: {
                    id: employeeId,
                    isHighlighted,
                    date: selectedDate
                }
            });
        } catch (error) {
            console.error('Error toggling highlight:', error);
        }
    }, [dispatch, selectedDate, isEditable]);

    const handlePrint = useCallback(() => {
        window.print();
    }, []);

    // Add a loading state that checks both local loading and Redux loading state
    const projectLoading = useSelector((state) => state.projectReducer.loading);
    if (isLoading || projectLoading) {
        return <div>Loading...</div>;
    }

    console.log('Scheduling.jsx projects data:', sortedProjects.map(p => ({
        job_id: p.job_id,
        job_number: p.job_number,
        job_name: p.job_name
      })));

    return (
        <div className="scheduling-container">
            <div style={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '20px', 
    gap: '10px' 
}}>
    <span className="total-employees">
        Total Employees: {totalAssignedEmployees}
    </span>
    
    {/* Formatted date for print */}
    <div className="date-display-print">
        {selectedDate && new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}
    </div>
    
    {/* Date picker for screen */}
    <DateSchedule />
                {isEditable && (
                    <button 
                        onClick={handleFinalize}
                        className="btn btn-primary"
                    >
                        Carry Forward
                    </button>
                )}
                {!isEditable && (
                    <div className="view-only-warning" style={{ color: 'red', margin: '0 10px' }}>
                        View Only
                    </div>
                )}
                <button
                    onClick={handlePrint}
                    className="btn"
                    style={{ marginLeft: 'auto' }}
                >
                    Print Schedule
                </button>
            </div>
            <div>
                {!projects || projects.length === 0 ? (
                    <table className="no-jobs-table">
                        <tbody>
                            <tr>
                                <td colSpan="7">YOU HAVE NO JOBS</td>
                            </tr>
                        </tbody>
                    </table>
                ) : (
                    <div className="jobs-container">
                        {sortedProjects.map((project, index) => (
                            <DraggableJobBox
                                key={project.job_id}
                                job={project}
                                index={index}
                                moveJob={moveJob}
                                moveEmployee={moveEmployee}
                                toggleHighlight={toggleHighlight}
                                employees={project.employees}
                                selectedDate={selectedDate}
                                isEditable={isEditable}
                                isDragging={project.job_id === draggedBoxId}
                                isHoverTarget={index === hoverTargetIndex}
                                onDragEnd={handleDragEnd}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(Scheduling);