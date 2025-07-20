import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Generic async state hook
export function useAsyncState<T>(
  initialState: T,
  asyncFn?: () => Promise<T>
) {
  const [state, setState] = useState<T>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (fn?: () => Promise<T>) => {
    const fnToExecute = fn || asyncFn;
    if (!fnToExecute) return;

    setLoading(true);
    setError(null);
    
    try {
      const result = await fnToExecute();
      setState(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [asyncFn]);

  useEffect(() => {
    if (asyncFn) {
      execute();
    }
  }, [execute, asyncFn]);

  return {
    state,
    setState,
    loading,
    error,
    execute,
    reset: () => {
      setState(initialState);
      setError(null);
      setLoading(false);
    }
  };
}

// Factory for creating CRUD hooks
export function createCRUDHook<T>(
  entityName: string,
  apiService: {
    getAll: () => Promise<T[]>;
    getById: (id: string) => Promise<T>;
    create: (data: Partial<T>) => Promise<T>;
    update: (id: string, data: Partial<T>) => Promise<T>;
    delete: (id: string) => Promise<void>;
  }
) {
  return function useCRUD() {
    const queryClient = useQueryClient();
    const queryKey = [entityName];

    // Queries
    const {
      data: items = [],
      isLoading: isLoadingList,
      error: listError
    } = useQuery({
      queryKey,
      queryFn: apiService.getAll
    });

    const getById = (id: string) => useQuery({
      queryKey: [...queryKey, id],
      queryFn: () => apiService.getById(id),
      enabled: !!id
    });

    // Mutations
    const createMutation = useMutation({
      mutationFn: apiService.create,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
      }
    });

    const updateMutation = useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<T> }) => 
        apiService.update(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
      }
    });

    const deleteMutation = useMutation({
      mutationFn: apiService.delete,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
      }
    });

    return {
      // Data
      items,
      isLoadingList,
      listError,
      
      // Methods
      getById,
      create: createMutation.mutate,
      update: (id: string, data: Partial<T>) => updateMutation.mutate({ id, data }),
      delete: deleteMutation.mutate,
      
      // States
      isCreating: createMutation.isPending,
      isUpdating: updateMutation.isPending,
      isDeleting: deleteMutation.isPending,
      
      // Errors
      createError: createMutation.error,
      updateError: updateMutation.error,
      deleteError: deleteMutation.error,
      
      // Utils
      refetch: () => queryClient.invalidateQueries({ queryKey })
    };
  };
}

// Factory for creating form hooks with validation
export function createFormHook<T extends Record<string, any>>(
  initialValues: T,
  validationSchema?: (values: T) => Record<string, string>
) {
  return function useForm() {
    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const setValue = useCallback((field: keyof T, value: any) => {
      setValues(prev => ({ ...prev, [field]: value }));
      
      // Clear error when user starts typing
      if (errors[field as string]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field as string];
          return newErrors;
        });
      }
    }, [errors]);

    const setFieldTouched = useCallback((field: keyof T) => {
      setTouched(prev => ({ ...prev, [field]: true }));
    }, []);

    const validate = useCallback(() => {
      if (!validationSchema) return true;
      
      const newErrors = validationSchema(values);
      setErrors(newErrors);
      
      return Object.keys(newErrors).length === 0;
    }, [values, validationSchema]);

    const reset = useCallback(() => {
      setValues(initialValues);
      setErrors({});
      setTouched({});
    }, [initialValues]);

    const getFieldProps = useCallback((field: keyof T) => ({
      value: values[field],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValue(field, e.target.value),
      onBlur: () => setFieldTouched(field),
      error: touched[field as string] ? errors[field as string] : undefined
    }), [values, errors, touched, setValue, setFieldTouched]);

    return {
      values,
      errors,
      touched,
      setValue,
      setFieldTouched,
      validate,
      reset,
      getFieldProps,
      isValid: Object.keys(errors).length === 0,
      isDirty: JSON.stringify(values) !== JSON.stringify(initialValues)
    };
  };
}

// Factory for creating pagination hooks
export function createPaginationHook(initialPage = 1, initialLimit = 20) {
  return function usePagination() {
    const [page, setPage] = useState(initialPage);
    const [limit, setLimit] = useState(initialLimit);

    const nextPage = useCallback(() => setPage(prev => prev + 1), []);
    const prevPage = useCallback(() => setPage(prev => Math.max(1, prev - 1)), []);
    const goToPage = useCallback((newPage: number) => setPage(Math.max(1, newPage)), []);
    const reset = useCallback(() => setPage(initialPage), [initialPage]);

    return {
      page,
      limit,
      setPage: goToPage,
      setLimit,
      nextPage,
      prevPage,
      reset,
      offset: (page - 1) * limit
    };
  };
}