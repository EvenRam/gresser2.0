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
    const isMoving = useRef(false);
    const [draggedBoxId, setDraggedBoxId] = useState(null);
    const [hoverTargetIndex, setHoverTargetIndex] = useState(null);
    
    const projectsByDate = useSelector((state) => state.projectReducer.projectsByDate);
    const selectedDate = useSelector((state) => state.scheduleReducer.selectedDate);
    const isEditable = useSelector((state) => state.scheduleReducer.isEditable);
    const highlightedEmployees = useSelector((state) => state.employeeReducer.highlightedEmployees);
    const employeesByDate = useSelector((state) => state.scheduleReducer.employeesByDate);
    
    const projects = useMemo(() => {
        return projectsByDate[selectedDate] || [];
    }, [projectsByDate, selectedDate]);

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

    const handleFinalize = useCallback(() => {
        if (!window.confirm('Are you sure you want to finalize this schedule?')) {
            return;
        }
        dispatch({
            type: 'FINALIZE_SCHEDULE',
            payload: { date: selectedDate }
        });
    }, [dispatch, selectedDate]);

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

        if (isMoving.current) return;
        isMoving.current = true;
        
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

    // UPDATED: Visual reordering only - no API call
    const moveJob = useCallback((dragIndex, hoverIndex) => {
        if (!isEditable || dragIndex === hoverIndex) return;
        
        setHoverTargetIndex(hoverIndex);
        
        const currentProjects = [...sortedProjects];
        const draggedProject = currentProjects[dragIndex];
        
        if (!draggedProject) {
            console.warn('No project found at dragIndex:', dragIndex);
            return;
        }
        
        setDraggedBoxId(draggedProject.job_id || draggedProject.id);
        
        const updatedProjects = [...currentProjects];
        updatedProjects.splice(dragIndex, 1);
        updatedProjects.splice(hoverIndex, 0, draggedProject);
        
        const projectsWithOrder = updatedProjects.map((project, index) => ({
            ...project,
            display_order: index
        }));
        
        // Update Redux for smooth UI - no API call here
        dispatch({
            type: 'REORDER_PROJECTS',
            payload: {
                sourceIndex: dragIndex,
                targetIndex: hoverIndex,
                date: selectedDate,
                projects: projectsWithOrder
            }
        });
    }, [dispatch, sortedProjects, selectedDate, isEditable]);

    // NEW: Save to backend only when drag ends
    const saveProjectOrder = useCallback(async () => {
        if (!isEditable || !sortedProjects.length) return;

        try {
            const orderedProjectIds = sortedProjects.map(p => p.job_id || p.id);
            
            await axios.put('/api/project/updateProjectOrder', {
                orderedProjectIds,
                date: selectedDate
            });
            
            console.log('Project order saved successfully');
        } catch (error) {
            console.error('Error saving project order:', error);
            // Reload on error to revert to server state
            dispatch({ 
                type: 'FETCH_PROJECTS_WITH_EMPLOYEES',
                payload: { date: selectedDate }
            });
        } finally {
            setDraggedBoxId(null);
            setHoverTargetIndex(null);
        }
    }, [sortedProjects, selectedDate, isEditable, dispatch]);
    
    const handleDragEnd = useCallback(() => {
        setDraggedBoxId(null);
        setHoverTargetIndex(null);
    }, []);

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

    const projectLoading = useSelector((state) => state.projectReducer.loading);
    if (isLoading || projectLoading) {
        return <div>Loading...</div>;
    }

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
                                onDragEnd={saveProjectOrder}
                                moveEmployee={moveEmployee}
                                toggleHighlight={toggleHighlight}
                                employees={project.employees}
                                selectedDate={selectedDate}
                                isEditable={isEditable}
                                isDragging={project.job_id === draggedBoxId}
                                isHoverTarget={index === hoverTargetIndex}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(Scheduling);