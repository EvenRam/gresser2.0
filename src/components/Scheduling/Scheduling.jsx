import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import DraggableJobBox from './DraggableJobBox';
import './EmployeeStyles.css';
import './Scheduling.css';
import DateSchedule from './DateSchedule';

const Scheduling = () => {
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(true);
    
    const projects = useSelector((state) => state.projectReducer.projects);
    const employeesByDate = useSelector((state) => state.scheduleReducer.employeesByDate);
    const selectedDate = useSelector((state) => state.scheduleReducer.selectedDate);
    const isEditable = useSelector((state) => state.scheduleReducer.isEditable);
    const highlightedEmployees = useSelector((state) => state.employeeReducer.highlightedEmployees);
 
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

    // Restore the handleFinalize function
    const handleFinalize = useCallback(() => {
        if (!window.confirm('Are you sure you want to finalize this schedule?')) {
            return;
        }
        dispatch({
            type: 'FINALIZE_SCHEDULE',
            payload: { date: selectedDate }
        });
    }, [dispatch, selectedDate]);
 
    const moveEmployee = useCallback((employeeId, targetProjectId, sourceProjectId) => {
        if (!isEditable) {
            console.warn('Cannot modify past dates');
            return;
        }
 
        dispatch({
            type: 'MOVE_EMPLOYEE',
            payload: {
                employeeId,
                targetProjectId,
                sourceProjectId,
                date: selectedDate
            },
        });
    }, [dispatch, selectedDate, isEditable]);
 
    const updateEmployeeOrder = useCallback(async (projectId, orderedEmployeeIds) => {
        if (!isEditable) return;
 
        try {
            await axios.put('/api/project/updateOrder', {
                projectId,
                orderedEmployeeIds,
                date: selectedDate
            });
 
            dispatch({
                type: 'UPDATE_EMPLOYEE_ORDER',
                payload: {
                    projectId,
                    employees: orderedEmployeeIds.map((id, index) => ({
                        id,
                        display_order: index
                    })),
                    date: selectedDate
                }
            });
        } catch (error) {
            console.error('Error updating employee order:', error);
        }
    }, [dispatch, selectedDate, isEditable]);
 
    const moveJob = useCallback(async (dragIndex, hoverIndex) => {
        if (!isEditable || dragIndex === hoverIndex) {
            return;
        }
    
        try {
            const currentProjects = [...sortedProjects];
            const draggedProject = currentProjects[dragIndex];
            
            if (!draggedProject) {
                console.warn('No project found at dragIndex:', dragIndex);
                return;
            }
    
            // Remove draggedProject from array
            currentProjects.splice(dragIndex, 1);
            // Insert it at the new position
            currentProjects.splice(hoverIndex, 0, draggedProject);
    
            // Update display orders
            const updatedProjects = currentProjects.map((project, index) => ({
                ...project,
                display_order: index
            }));
    
            // Update Redux first for immediate UI feedback
            dispatch({
                type: 'REORDER_PROJECTS',
                payload: {
                    sourceIndex: dragIndex,
                    targetIndex: hoverIndex,
                    date: selectedDate,
                    projects: updatedProjects
                }
            });
    
            // Then update the backend
            const orderedProjectIds = updatedProjects.map(p => p.job_id || p.id);
            await axios.put('/api/project/updateProjectOrder', {
                orderedProjectIds,
                date: selectedDate
            });
    
        } catch (error) {
            console.error('Error in moveJob:', error);
            // Revert on error
            dispatch({ 
                type: 'FETCH_PROJECTS_WITH_EMPLOYEES',
                payload: { date: selectedDate }
            });
        }
    }, [dispatch, sortedProjects, selectedDate, isEditable]);
 
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
 
    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="scheduling-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '10px' }}>
                <span className="total-employees">Total Employees: {totalAssignedEmployees}</span>
                <DateSchedule />
                {isEditable && (
                    <button 
                        onClick={handleFinalize}
                        className="btn btn-primary"
                    >
                        Finalize Schedule
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
                                updateEmployeeOrder={updateEmployeeOrder}
                                toggleHighlight={toggleHighlight}
                                employees={project.employees}
                                selectedDate={selectedDate}
                                isEditable={isEditable}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(Scheduling);