/**
 * Shared validation schemas between frontend and backend
 * This file contains TypeScript interfaces and Zod schemas that ensure
 * consistent validation rules across client and server
 */
import { z } from 'zod';
export declare const commonValidators: {
    id: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
    title: z.ZodString;
    content: z.ZodString;
    visibility: z.ZodEnum<["private", "team", "public"]>;
    role: z.ZodEnum<["owner", "admin", "member"]>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    dateFrom: z.ZodOptional<z.ZodDate>;
    dateTo: z.ZodOptional<z.ZodDate>;
    search: z.ZodOptional<z.ZodString>;
};
export declare const authSchemas: {
    register: z.ZodObject<{
        email: z.ZodString;
        name: z.ZodString;
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        password: string;
        email: string;
        name: string;
    }, {
        password: string;
        email: string;
        name: string;
    }>;
    registerWithConfirm: z.ZodEffects<z.ZodObject<{
        email: z.ZodString;
        name: z.ZodString;
        password: z.ZodString;
        confirmPassword: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        password: string;
        email: string;
        name: string;
        confirmPassword: string;
    }, {
        password: string;
        email: string;
        name: string;
        confirmPassword: string;
    }>, {
        password: string;
        email: string;
        name: string;
        confirmPassword: string;
    }, {
        password: string;
        email: string;
        name: string;
        confirmPassword: string;
    }>;
    login: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        password: string;
        email: string;
    }, {
        password: string;
        email: string;
    }>;
    resetPassword: z.ZodObject<{
        email: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
    }, {
        email: string;
    }>;
    updatePassword: z.ZodEffects<z.ZodObject<{
        currentPassword: z.ZodString;
        newPassword: z.ZodString;
        confirmPassword: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
    }, {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
    }>, {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
    }, {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
    }>;
};
export declare const teamSchemas: {
    create: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description?: string | undefined;
    }, {
        name: string;
        description?: string | undefined;
    }>;
    update: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        description?: string | undefined;
    }, {
        name?: string | undefined;
        description?: string | undefined;
    }>;
    inviteMember: z.ZodObject<{
        email: z.ZodString;
        role: z.ZodDefault<z.ZodEnum<["owner", "admin", "member"]>>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        role: "owner" | "admin" | "member";
    }, {
        email: string;
        role?: "owner" | "admin" | "member" | undefined;
    }>;
    updateMemberRole: z.ZodObject<{
        role: z.ZodEnum<["owner", "admin", "member"]>;
    }, "strip", z.ZodTypeAny, {
        role: "owner" | "admin" | "member";
    }, {
        role: "owner" | "admin" | "member";
    }>;
    filters: z.ZodObject<{
        search: z.ZodOptional<z.ZodString>;
        page: z.ZodDefault<z.ZodNumber>;
        limit: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        search?: string | undefined;
    }, {
        search?: string | undefined;
        page?: number | undefined;
        limit?: number | undefined;
    }>;
};
export declare const prdSchemas: {
    create: z.ZodObject<{
        title: z.ZodString;
        content: z.ZodString;
        teamId: z.ZodOptional<z.ZodString>;
        visibility: z.ZodDefault<z.ZodEnum<["private", "team", "public"]>>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        templateId: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        content: string;
        visibility: "private" | "team" | "public";
        teamId?: string | undefined;
        metadata?: Record<string, any> | undefined;
        templateId?: string | undefined;
        tags?: string[] | undefined;
    }, {
        title: string;
        content: string;
        teamId?: string | undefined;
        visibility?: "private" | "team" | "public" | undefined;
        metadata?: Record<string, any> | undefined;
        templateId?: string | undefined;
        tags?: string[] | undefined;
    }>;
    update: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        content: z.ZodOptional<z.ZodString>;
        visibility: z.ZodOptional<z.ZodEnum<["private", "team", "public"]>>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        title?: string | undefined;
        content?: string | undefined;
        visibility?: "private" | "team" | "public" | undefined;
        metadata?: Record<string, any> | undefined;
        tags?: string[] | undefined;
    }, {
        title?: string | undefined;
        content?: string | undefined;
        visibility?: "private" | "team" | "public" | undefined;
        metadata?: Record<string, any> | undefined;
        tags?: string[] | undefined;
    }>;
    filters: z.ZodEffects<z.ZodObject<{
        search: z.ZodOptional<z.ZodString>;
        author: z.ZodOptional<z.ZodString>;
        dateFrom: z.ZodOptional<z.ZodDate>;
        dateTo: z.ZodOptional<z.ZodDate>;
        templateId: z.ZodOptional<z.ZodString>;
        visibility: z.ZodOptional<z.ZodEnum<["private", "team", "public"]>>;
        teamId: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        page: z.ZodDefault<z.ZodNumber>;
        limit: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        search?: string | undefined;
        dateFrom?: Date | undefined;
        dateTo?: Date | undefined;
        teamId?: string | undefined;
        visibility?: "private" | "team" | "public" | undefined;
        templateId?: string | undefined;
        tags?: string[] | undefined;
        author?: string | undefined;
    }, {
        search?: string | undefined;
        page?: number | undefined;
        limit?: number | undefined;
        dateFrom?: Date | undefined;
        dateTo?: Date | undefined;
        teamId?: string | undefined;
        visibility?: "private" | "team" | "public" | undefined;
        templateId?: string | undefined;
        tags?: string[] | undefined;
        author?: string | undefined;
    }>, {
        page: number;
        limit: number;
        search?: string | undefined;
        dateFrom?: Date | undefined;
        dateTo?: Date | undefined;
        teamId?: string | undefined;
        visibility?: "private" | "team" | "public" | undefined;
        templateId?: string | undefined;
        tags?: string[] | undefined;
        author?: string | undefined;
    }, {
        search?: string | undefined;
        page?: number | undefined;
        limit?: number | undefined;
        dateFrom?: Date | undefined;
        dateTo?: Date | undefined;
        teamId?: string | undefined;
        visibility?: "private" | "team" | "public" | undefined;
        templateId?: string | undefined;
        tags?: string[] | undefined;
        author?: string | undefined;
    }>;
    bulkOperation: z.ZodObject<{
        prdIds: z.ZodArray<z.ZodString, "many">;
        operation: z.ZodEnum<["delete", "archive", "updateVisibility"]>;
        data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        prdIds: string[];
        operation: "delete" | "archive" | "updateVisibility";
        data?: Record<string, any> | undefined;
    }, {
        prdIds: string[];
        operation: "delete" | "archive" | "updateVisibility";
        data?: Record<string, any> | undefined;
    }>;
};
export declare const analyticsSchemas: {
    trackEvent: z.ZodObject<{
        eventType: z.ZodString;
        eventCategory: z.ZodString;
        eventData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        prdId: z.ZodOptional<z.ZodString>;
        sessionId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        eventType: string;
        eventCategory: string;
        eventData?: Record<string, any> | undefined;
        prdId?: string | undefined;
        sessionId?: string | undefined;
        timestamp?: Date | undefined;
    }, {
        eventType: string;
        eventCategory: string;
        eventData?: Record<string, any> | undefined;
        prdId?: string | undefined;
        sessionId?: string | undefined;
        timestamp?: Date | undefined;
    }>;
    query: z.ZodObject<{
        timeRange: z.ZodDefault<z.ZodEnum<["7d", "30d", "90d", "6m", "1y"]>>;
        teamId: z.ZodOptional<z.ZodString>;
        eventType: z.ZodOptional<z.ZodString>;
        eventCategory: z.ZodOptional<z.ZodString>;
        prdId: z.ZodOptional<z.ZodString>;
        page: z.ZodDefault<z.ZodNumber>;
        limit: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        timeRange: "7d" | "30d" | "90d" | "6m" | "1y";
        teamId?: string | undefined;
        eventType?: string | undefined;
        eventCategory?: string | undefined;
        prdId?: string | undefined;
    }, {
        page?: number | undefined;
        limit?: number | undefined;
        teamId?: string | undefined;
        eventType?: string | undefined;
        eventCategory?: string | undefined;
        prdId?: string | undefined;
        timeRange?: "7d" | "30d" | "90d" | "6m" | "1y" | undefined;
    }>;
    dashboard: z.ZodObject<{
        timeRange: z.ZodDefault<z.ZodEnum<["7d", "30d", "90d"]>>;
        teamId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        timeRange: "7d" | "30d" | "90d";
        teamId?: string | undefined;
    }, {
        teamId?: string | undefined;
        timeRange?: "7d" | "30d" | "90d" | undefined;
    }>;
};
export declare const templateSchemas: {
    create: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        structure: z.ZodObject<{
            questions: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                label: z.ZodString;
                type: z.ZodEnum<["text", "textarea", "select", "checkbox", "radio"]>;
                placeholder: z.ZodOptional<z.ZodString>;
                options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                required: z.ZodDefault<z.ZodBoolean>;
                validation: z.ZodOptional<z.ZodObject<{
                    minLength: z.ZodOptional<z.ZodNumber>;
                    maxLength: z.ZodOptional<z.ZodNumber>;
                    pattern: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    minLength?: number | undefined;
                    maxLength?: number | undefined;
                    pattern?: string | undefined;
                }, {
                    minLength?: number | undefined;
                    maxLength?: number | undefined;
                    pattern?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                id: string;
                required: boolean;
                label: string;
                type: "text" | "textarea" | "select" | "checkbox" | "radio";
                options?: string[] | undefined;
                placeholder?: string | undefined;
                validation?: {
                    minLength?: number | undefined;
                    maxLength?: number | undefined;
                    pattern?: string | undefined;
                } | undefined;
            }, {
                id: string;
                label: string;
                type: "text" | "textarea" | "select" | "checkbox" | "radio";
                options?: string[] | undefined;
                required?: boolean | undefined;
                placeholder?: string | undefined;
                validation?: {
                    minLength?: number | undefined;
                    maxLength?: number | undefined;
                    pattern?: string | undefined;
                } | undefined;
            }>, "many">;
            sections: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            questions: {
                id: string;
                required: boolean;
                label: string;
                type: "text" | "textarea" | "select" | "checkbox" | "radio";
                options?: string[] | undefined;
                placeholder?: string | undefined;
                validation?: {
                    minLength?: number | undefined;
                    maxLength?: number | undefined;
                    pattern?: string | undefined;
                } | undefined;
            }[];
            sections: string[];
        }, {
            questions: {
                id: string;
                label: string;
                type: "text" | "textarea" | "select" | "checkbox" | "radio";
                options?: string[] | undefined;
                required?: boolean | undefined;
                placeholder?: string | undefined;
                validation?: {
                    minLength?: number | undefined;
                    maxLength?: number | undefined;
                    pattern?: string | undefined;
                } | undefined;
            }[];
            sections: string[];
        }>;
        industry: z.ZodOptional<z.ZodString>;
        isPublic: z.ZodDefault<z.ZodBoolean>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        structure: {
            questions: {
                id: string;
                required: boolean;
                label: string;
                type: "text" | "textarea" | "select" | "checkbox" | "radio";
                options?: string[] | undefined;
                placeholder?: string | undefined;
                validation?: {
                    minLength?: number | undefined;
                    maxLength?: number | undefined;
                    pattern?: string | undefined;
                } | undefined;
            }[];
            sections: string[];
        };
        isPublic: boolean;
        description?: string | undefined;
        tags?: string[] | undefined;
        industry?: string | undefined;
    }, {
        name: string;
        structure: {
            questions: {
                id: string;
                label: string;
                type: "text" | "textarea" | "select" | "checkbox" | "radio";
                options?: string[] | undefined;
                required?: boolean | undefined;
                placeholder?: string | undefined;
                validation?: {
                    minLength?: number | undefined;
                    maxLength?: number | undefined;
                    pattern?: string | undefined;
                } | undefined;
            }[];
            sections: string[];
        };
        description?: string | undefined;
        tags?: string[] | undefined;
        industry?: string | undefined;
        isPublic?: boolean | undefined;
    }>;
    update: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        structure: z.ZodOptional<z.ZodObject<{
            questions: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                label: z.ZodString;
                type: z.ZodEnum<["text", "textarea", "select", "checkbox", "radio"]>;
                placeholder: z.ZodOptional<z.ZodString>;
                options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                required: z.ZodDefault<z.ZodBoolean>;
                validation: z.ZodOptional<z.ZodObject<{
                    minLength: z.ZodOptional<z.ZodNumber>;
                    maxLength: z.ZodOptional<z.ZodNumber>;
                    pattern: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    minLength?: number | undefined;
                    maxLength?: number | undefined;
                    pattern?: string | undefined;
                }, {
                    minLength?: number | undefined;
                    maxLength?: number | undefined;
                    pattern?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                id: string;
                required: boolean;
                label: string;
                type: "text" | "textarea" | "select" | "checkbox" | "radio";
                options?: string[] | undefined;
                placeholder?: string | undefined;
                validation?: {
                    minLength?: number | undefined;
                    maxLength?: number | undefined;
                    pattern?: string | undefined;
                } | undefined;
            }, {
                id: string;
                label: string;
                type: "text" | "textarea" | "select" | "checkbox" | "radio";
                options?: string[] | undefined;
                required?: boolean | undefined;
                placeholder?: string | undefined;
                validation?: {
                    minLength?: number | undefined;
                    maxLength?: number | undefined;
                    pattern?: string | undefined;
                } | undefined;
            }>, "many">>;
            sections: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            questions?: {
                id: string;
                required: boolean;
                label: string;
                type: "text" | "textarea" | "select" | "checkbox" | "radio";
                options?: string[] | undefined;
                placeholder?: string | undefined;
                validation?: {
                    minLength?: number | undefined;
                    maxLength?: number | undefined;
                    pattern?: string | undefined;
                } | undefined;
            }[] | undefined;
            sections?: string[] | undefined;
        }, {
            questions?: {
                id: string;
                label: string;
                type: "text" | "textarea" | "select" | "checkbox" | "radio";
                options?: string[] | undefined;
                required?: boolean | undefined;
                placeholder?: string | undefined;
                validation?: {
                    minLength?: number | undefined;
                    maxLength?: number | undefined;
                    pattern?: string | undefined;
                } | undefined;
            }[] | undefined;
            sections?: string[] | undefined;
        }>>;
        industry: z.ZodOptional<z.ZodString>;
        isPublic: z.ZodOptional<z.ZodBoolean>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        description?: string | undefined;
        tags?: string[] | undefined;
        structure?: {
            questions?: {
                id: string;
                required: boolean;
                label: string;
                type: "text" | "textarea" | "select" | "checkbox" | "radio";
                options?: string[] | undefined;
                placeholder?: string | undefined;
                validation?: {
                    minLength?: number | undefined;
                    maxLength?: number | undefined;
                    pattern?: string | undefined;
                } | undefined;
            }[] | undefined;
            sections?: string[] | undefined;
        } | undefined;
        industry?: string | undefined;
        isPublic?: boolean | undefined;
    }, {
        name?: string | undefined;
        description?: string | undefined;
        tags?: string[] | undefined;
        structure?: {
            questions?: {
                id: string;
                label: string;
                type: "text" | "textarea" | "select" | "checkbox" | "radio";
                options?: string[] | undefined;
                required?: boolean | undefined;
                placeholder?: string | undefined;
                validation?: {
                    minLength?: number | undefined;
                    maxLength?: number | undefined;
                    pattern?: string | undefined;
                } | undefined;
            }[] | undefined;
            sections?: string[] | undefined;
        } | undefined;
        industry?: string | undefined;
        isPublic?: boolean | undefined;
    }>;
    filters: z.ZodObject<{
        search: z.ZodOptional<z.ZodString>;
        industry: z.ZodOptional<z.ZodString>;
        isPublic: z.ZodOptional<z.ZodBoolean>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        page: z.ZodDefault<z.ZodNumber>;
        limit: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        search?: string | undefined;
        tags?: string[] | undefined;
        industry?: string | undefined;
        isPublic?: boolean | undefined;
    }, {
        search?: string | undefined;
        page?: number | undefined;
        limit?: number | undefined;
        tags?: string[] | undefined;
        industry?: string | undefined;
        isPublic?: boolean | undefined;
    }>;
};
export declare const commentSchemas: {
    create: z.ZodObject<{
        content: z.ZodString;
        section: z.ZodString;
        position: z.ZodNumber;
        parentId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        content: string;
        section: string;
        position: number;
        parentId?: string | undefined;
    }, {
        content: string;
        section: string;
        position: number;
        parentId?: string | undefined;
    }>;
    update: z.ZodObject<{
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        content: string;
    }, {
        content: string;
    }>;
    resolve: z.ZodObject<{
        resolved: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        resolved: boolean;
    }, {
        resolved: boolean;
    }>;
};
export declare const collaborationSchemas: {
    operation: z.ZodObject<{
        type: z.ZodEnum<["insert", "delete", "replace"]>;
        section: z.ZodString;
        position: z.ZodNumber;
        content: z.ZodOptional<z.ZodString>;
        length: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: "replace" | "insert" | "delete";
        section: string;
        position: number;
        length?: number | undefined;
        content?: string | undefined;
    }, {
        type: "replace" | "insert" | "delete";
        section: string;
        position: number;
        length?: number | undefined;
        content?: string | undefined;
    }>;
    presence: z.ZodObject<{
        type: z.ZodEnum<["cursor", "selection", "typing", "idle"]>;
        data: z.ZodObject<{
            section: z.ZodOptional<z.ZodString>;
            position: z.ZodOptional<z.ZodNumber>;
            start: z.ZodOptional<z.ZodNumber>;
            end: z.ZodOptional<z.ZodNumber>;
            isTyping: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            end?: number | undefined;
            section?: string | undefined;
            position?: number | undefined;
            start?: number | undefined;
            isTyping?: boolean | undefined;
        }, {
            end?: number | undefined;
            section?: string | undefined;
            position?: number | undefined;
            start?: number | undefined;
            isTyping?: boolean | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        data: {
            end?: number | undefined;
            section?: string | undefined;
            position?: number | undefined;
            start?: number | undefined;
            isTyping?: boolean | undefined;
        };
        type: "cursor" | "selection" | "typing" | "idle";
    }, {
        data: {
            end?: number | undefined;
            section?: string | undefined;
            position?: number | undefined;
            start?: number | undefined;
            isTyping?: boolean | undefined;
        };
        type: "cursor" | "selection" | "typing" | "idle";
    }>;
};
export declare const fileSchemas: {
    upload: z.ZodObject<{
        type: z.ZodEnum<["avatar", "document", "template"]>;
        filename: z.ZodString;
        contentType: z.ZodEnum<["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "text/plain", "text/markdown"]>;
        size: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "avatar" | "document" | "template";
        filename: string;
        contentType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "application/pdf" | "text/plain" | "text/markdown";
        size: number;
    }, {
        type: "avatar" | "document" | "template";
        filename: string;
        contentType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "application/pdf" | "text/plain" | "text/markdown";
        size: number;
    }>;
};
export declare const onboardingSchemas: {
    updateStep: z.ZodObject<{
        step: z.ZodEnum<["account_setup", "team_creation", "first_prd", "collaboration", "completed"]>;
        data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        step: "account_setup" | "team_creation" | "first_prd" | "collaboration" | "completed";
        data?: Record<string, any> | undefined;
    }, {
        step: "account_setup" | "team_creation" | "first_prd" | "collaboration" | "completed";
        data?: Record<string, any> | undefined;
    }>;
    completeOnboarding: z.ZodObject<{
        feedback: z.ZodOptional<z.ZodString>;
        rating: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        feedback?: string | undefined;
        rating?: number | undefined;
    }, {
        feedback?: string | undefined;
        rating?: number | undefined;
    }>;
};
export declare const notificationSchemas: {
    create: z.ZodObject<{
        type: z.ZodEnum<["comment", "mention", "invite", "update"]>;
        title: z.ZodString;
        message: z.ZodString;
        recipientId: z.ZodString;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        type: "update" | "comment" | "mention" | "invite";
        message: string;
        recipientId: string;
        metadata?: Record<string, any> | undefined;
    }, {
        title: string;
        type: "update" | "comment" | "mention" | "invite";
        message: string;
        recipientId: string;
        metadata?: Record<string, any> | undefined;
    }>;
    markRead: z.ZodObject<{
        notificationIds: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        notificationIds: string[];
    }, {
        notificationIds: string[];
    }>;
    filters: z.ZodObject<{
        type: z.ZodOptional<z.ZodEnum<["comment", "mention", "invite", "update"]>>;
        read: z.ZodOptional<z.ZodBoolean>;
        page: z.ZodDefault<z.ZodNumber>;
        limit: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        type?: "update" | "comment" | "mention" | "invite" | undefined;
        read?: boolean | undefined;
    }, {
        page?: number | undefined;
        limit?: number | undefined;
        type?: "update" | "comment" | "mention" | "invite" | undefined;
        read?: boolean | undefined;
    }>;
};
export declare const sharedValidationSchemas: {
    auth: {
        register: z.ZodObject<{
            email: z.ZodString;
            name: z.ZodString;
            password: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            password: string;
            email: string;
            name: string;
        }, {
            password: string;
            email: string;
            name: string;
        }>;
        registerWithConfirm: z.ZodEffects<z.ZodObject<{
            email: z.ZodString;
            name: z.ZodString;
            password: z.ZodString;
            confirmPassword: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            password: string;
            email: string;
            name: string;
            confirmPassword: string;
        }, {
            password: string;
            email: string;
            name: string;
            confirmPassword: string;
        }>, {
            password: string;
            email: string;
            name: string;
            confirmPassword: string;
        }, {
            password: string;
            email: string;
            name: string;
            confirmPassword: string;
        }>;
        login: z.ZodObject<{
            email: z.ZodString;
            password: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            password: string;
            email: string;
        }, {
            password: string;
            email: string;
        }>;
        resetPassword: z.ZodObject<{
            email: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            email: string;
        }, {
            email: string;
        }>;
        updatePassword: z.ZodEffects<z.ZodObject<{
            currentPassword: z.ZodString;
            newPassword: z.ZodString;
            confirmPassword: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            currentPassword: string;
            newPassword: string;
            confirmPassword: string;
        }, {
            currentPassword: string;
            newPassword: string;
            confirmPassword: string;
        }>, {
            currentPassword: string;
            newPassword: string;
            confirmPassword: string;
        }, {
            currentPassword: string;
            newPassword: string;
            confirmPassword: string;
        }>;
    };
    team: {
        create: z.ZodObject<{
            name: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            description?: string | undefined;
        }, {
            name: string;
            description?: string | undefined;
        }>;
        update: z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name?: string | undefined;
            description?: string | undefined;
        }, {
            name?: string | undefined;
            description?: string | undefined;
        }>;
        inviteMember: z.ZodObject<{
            email: z.ZodString;
            role: z.ZodDefault<z.ZodEnum<["owner", "admin", "member"]>>;
        }, "strip", z.ZodTypeAny, {
            email: string;
            role: "owner" | "admin" | "member";
        }, {
            email: string;
            role?: "owner" | "admin" | "member" | undefined;
        }>;
        updateMemberRole: z.ZodObject<{
            role: z.ZodEnum<["owner", "admin", "member"]>;
        }, "strip", z.ZodTypeAny, {
            role: "owner" | "admin" | "member";
        }, {
            role: "owner" | "admin" | "member";
        }>;
        filters: z.ZodObject<{
            search: z.ZodOptional<z.ZodString>;
            page: z.ZodDefault<z.ZodNumber>;
            limit: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            page: number;
            limit: number;
            search?: string | undefined;
        }, {
            search?: string | undefined;
            page?: number | undefined;
            limit?: number | undefined;
        }>;
    };
    prd: {
        create: z.ZodObject<{
            title: z.ZodString;
            content: z.ZodString;
            teamId: z.ZodOptional<z.ZodString>;
            visibility: z.ZodDefault<z.ZodEnum<["private", "team", "public"]>>;
            metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            templateId: z.ZodOptional<z.ZodString>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            title: string;
            content: string;
            visibility: "private" | "team" | "public";
            teamId?: string | undefined;
            metadata?: Record<string, any> | undefined;
            templateId?: string | undefined;
            tags?: string[] | undefined;
        }, {
            title: string;
            content: string;
            teamId?: string | undefined;
            visibility?: "private" | "team" | "public" | undefined;
            metadata?: Record<string, any> | undefined;
            templateId?: string | undefined;
            tags?: string[] | undefined;
        }>;
        update: z.ZodObject<{
            title: z.ZodOptional<z.ZodString>;
            content: z.ZodOptional<z.ZodString>;
            visibility: z.ZodOptional<z.ZodEnum<["private", "team", "public"]>>;
            metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            title?: string | undefined;
            content?: string | undefined;
            visibility?: "private" | "team" | "public" | undefined;
            metadata?: Record<string, any> | undefined;
            tags?: string[] | undefined;
        }, {
            title?: string | undefined;
            content?: string | undefined;
            visibility?: "private" | "team" | "public" | undefined;
            metadata?: Record<string, any> | undefined;
            tags?: string[] | undefined;
        }>;
        filters: z.ZodEffects<z.ZodObject<{
            search: z.ZodOptional<z.ZodString>;
            author: z.ZodOptional<z.ZodString>;
            dateFrom: z.ZodOptional<z.ZodDate>;
            dateTo: z.ZodOptional<z.ZodDate>;
            templateId: z.ZodOptional<z.ZodString>;
            visibility: z.ZodOptional<z.ZodEnum<["private", "team", "public"]>>;
            teamId: z.ZodOptional<z.ZodString>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            page: z.ZodDefault<z.ZodNumber>;
            limit: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            page: number;
            limit: number;
            search?: string | undefined;
            dateFrom?: Date | undefined;
            dateTo?: Date | undefined;
            teamId?: string | undefined;
            visibility?: "private" | "team" | "public" | undefined;
            templateId?: string | undefined;
            tags?: string[] | undefined;
            author?: string | undefined;
        }, {
            search?: string | undefined;
            page?: number | undefined;
            limit?: number | undefined;
            dateFrom?: Date | undefined;
            dateTo?: Date | undefined;
            teamId?: string | undefined;
            visibility?: "private" | "team" | "public" | undefined;
            templateId?: string | undefined;
            tags?: string[] | undefined;
            author?: string | undefined;
        }>, {
            page: number;
            limit: number;
            search?: string | undefined;
            dateFrom?: Date | undefined;
            dateTo?: Date | undefined;
            teamId?: string | undefined;
            visibility?: "private" | "team" | "public" | undefined;
            templateId?: string | undefined;
            tags?: string[] | undefined;
            author?: string | undefined;
        }, {
            search?: string | undefined;
            page?: number | undefined;
            limit?: number | undefined;
            dateFrom?: Date | undefined;
            dateTo?: Date | undefined;
            teamId?: string | undefined;
            visibility?: "private" | "team" | "public" | undefined;
            templateId?: string | undefined;
            tags?: string[] | undefined;
            author?: string | undefined;
        }>;
        bulkOperation: z.ZodObject<{
            prdIds: z.ZodArray<z.ZodString, "many">;
            operation: z.ZodEnum<["delete", "archive", "updateVisibility"]>;
            data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            prdIds: string[];
            operation: "delete" | "archive" | "updateVisibility";
            data?: Record<string, any> | undefined;
        }, {
            prdIds: string[];
            operation: "delete" | "archive" | "updateVisibility";
            data?: Record<string, any> | undefined;
        }>;
    };
    analytics: {
        trackEvent: z.ZodObject<{
            eventType: z.ZodString;
            eventCategory: z.ZodString;
            eventData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            prdId: z.ZodOptional<z.ZodString>;
            sessionId: z.ZodOptional<z.ZodString>;
            timestamp: z.ZodOptional<z.ZodDate>;
        }, "strip", z.ZodTypeAny, {
            eventType: string;
            eventCategory: string;
            eventData?: Record<string, any> | undefined;
            prdId?: string | undefined;
            sessionId?: string | undefined;
            timestamp?: Date | undefined;
        }, {
            eventType: string;
            eventCategory: string;
            eventData?: Record<string, any> | undefined;
            prdId?: string | undefined;
            sessionId?: string | undefined;
            timestamp?: Date | undefined;
        }>;
        query: z.ZodObject<{
            timeRange: z.ZodDefault<z.ZodEnum<["7d", "30d", "90d", "6m", "1y"]>>;
            teamId: z.ZodOptional<z.ZodString>;
            eventType: z.ZodOptional<z.ZodString>;
            eventCategory: z.ZodOptional<z.ZodString>;
            prdId: z.ZodOptional<z.ZodString>;
            page: z.ZodDefault<z.ZodNumber>;
            limit: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            page: number;
            limit: number;
            timeRange: "7d" | "30d" | "90d" | "6m" | "1y";
            teamId?: string | undefined;
            eventType?: string | undefined;
            eventCategory?: string | undefined;
            prdId?: string | undefined;
        }, {
            page?: number | undefined;
            limit?: number | undefined;
            teamId?: string | undefined;
            eventType?: string | undefined;
            eventCategory?: string | undefined;
            prdId?: string | undefined;
            timeRange?: "7d" | "30d" | "90d" | "6m" | "1y" | undefined;
        }>;
        dashboard: z.ZodObject<{
            timeRange: z.ZodDefault<z.ZodEnum<["7d", "30d", "90d"]>>;
            teamId: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            timeRange: "7d" | "30d" | "90d";
            teamId?: string | undefined;
        }, {
            teamId?: string | undefined;
            timeRange?: "7d" | "30d" | "90d" | undefined;
        }>;
    };
    template: {
        create: z.ZodObject<{
            name: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            structure: z.ZodObject<{
                questions: z.ZodArray<z.ZodObject<{
                    id: z.ZodString;
                    label: z.ZodString;
                    type: z.ZodEnum<["text", "textarea", "select", "checkbox", "radio"]>;
                    placeholder: z.ZodOptional<z.ZodString>;
                    options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    required: z.ZodDefault<z.ZodBoolean>;
                    validation: z.ZodOptional<z.ZodObject<{
                        minLength: z.ZodOptional<z.ZodNumber>;
                        maxLength: z.ZodOptional<z.ZodNumber>;
                        pattern: z.ZodOptional<z.ZodString>;
                    }, "strip", z.ZodTypeAny, {
                        minLength?: number | undefined;
                        maxLength?: number | undefined;
                        pattern?: string | undefined;
                    }, {
                        minLength?: number | undefined;
                        maxLength?: number | undefined;
                        pattern?: string | undefined;
                    }>>;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    required: boolean;
                    label: string;
                    type: "text" | "textarea" | "select" | "checkbox" | "radio";
                    options?: string[] | undefined;
                    placeholder?: string | undefined;
                    validation?: {
                        minLength?: number | undefined;
                        maxLength?: number | undefined;
                        pattern?: string | undefined;
                    } | undefined;
                }, {
                    id: string;
                    label: string;
                    type: "text" | "textarea" | "select" | "checkbox" | "radio";
                    options?: string[] | undefined;
                    required?: boolean | undefined;
                    placeholder?: string | undefined;
                    validation?: {
                        minLength?: number | undefined;
                        maxLength?: number | undefined;
                        pattern?: string | undefined;
                    } | undefined;
                }>, "many">;
                sections: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                questions: {
                    id: string;
                    required: boolean;
                    label: string;
                    type: "text" | "textarea" | "select" | "checkbox" | "radio";
                    options?: string[] | undefined;
                    placeholder?: string | undefined;
                    validation?: {
                        minLength?: number | undefined;
                        maxLength?: number | undefined;
                        pattern?: string | undefined;
                    } | undefined;
                }[];
                sections: string[];
            }, {
                questions: {
                    id: string;
                    label: string;
                    type: "text" | "textarea" | "select" | "checkbox" | "radio";
                    options?: string[] | undefined;
                    required?: boolean | undefined;
                    placeholder?: string | undefined;
                    validation?: {
                        minLength?: number | undefined;
                        maxLength?: number | undefined;
                        pattern?: string | undefined;
                    } | undefined;
                }[];
                sections: string[];
            }>;
            industry: z.ZodOptional<z.ZodString>;
            isPublic: z.ZodDefault<z.ZodBoolean>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            structure: {
                questions: {
                    id: string;
                    required: boolean;
                    label: string;
                    type: "text" | "textarea" | "select" | "checkbox" | "radio";
                    options?: string[] | undefined;
                    placeholder?: string | undefined;
                    validation?: {
                        minLength?: number | undefined;
                        maxLength?: number | undefined;
                        pattern?: string | undefined;
                    } | undefined;
                }[];
                sections: string[];
            };
            isPublic: boolean;
            description?: string | undefined;
            tags?: string[] | undefined;
            industry?: string | undefined;
        }, {
            name: string;
            structure: {
                questions: {
                    id: string;
                    label: string;
                    type: "text" | "textarea" | "select" | "checkbox" | "radio";
                    options?: string[] | undefined;
                    required?: boolean | undefined;
                    placeholder?: string | undefined;
                    validation?: {
                        minLength?: number | undefined;
                        maxLength?: number | undefined;
                        pattern?: string | undefined;
                    } | undefined;
                }[];
                sections: string[];
            };
            description?: string | undefined;
            tags?: string[] | undefined;
            industry?: string | undefined;
            isPublic?: boolean | undefined;
        }>;
        update: z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            structure: z.ZodOptional<z.ZodObject<{
                questions: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    id: z.ZodString;
                    label: z.ZodString;
                    type: z.ZodEnum<["text", "textarea", "select", "checkbox", "radio"]>;
                    placeholder: z.ZodOptional<z.ZodString>;
                    options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                    required: z.ZodDefault<z.ZodBoolean>;
                    validation: z.ZodOptional<z.ZodObject<{
                        minLength: z.ZodOptional<z.ZodNumber>;
                        maxLength: z.ZodOptional<z.ZodNumber>;
                        pattern: z.ZodOptional<z.ZodString>;
                    }, "strip", z.ZodTypeAny, {
                        minLength?: number | undefined;
                        maxLength?: number | undefined;
                        pattern?: string | undefined;
                    }, {
                        minLength?: number | undefined;
                        maxLength?: number | undefined;
                        pattern?: string | undefined;
                    }>>;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    required: boolean;
                    label: string;
                    type: "text" | "textarea" | "select" | "checkbox" | "radio";
                    options?: string[] | undefined;
                    placeholder?: string | undefined;
                    validation?: {
                        minLength?: number | undefined;
                        maxLength?: number | undefined;
                        pattern?: string | undefined;
                    } | undefined;
                }, {
                    id: string;
                    label: string;
                    type: "text" | "textarea" | "select" | "checkbox" | "radio";
                    options?: string[] | undefined;
                    required?: boolean | undefined;
                    placeholder?: string | undefined;
                    validation?: {
                        minLength?: number | undefined;
                        maxLength?: number | undefined;
                        pattern?: string | undefined;
                    } | undefined;
                }>, "many">>;
                sections: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                questions?: {
                    id: string;
                    required: boolean;
                    label: string;
                    type: "text" | "textarea" | "select" | "checkbox" | "radio";
                    options?: string[] | undefined;
                    placeholder?: string | undefined;
                    validation?: {
                        minLength?: number | undefined;
                        maxLength?: number | undefined;
                        pattern?: string | undefined;
                    } | undefined;
                }[] | undefined;
                sections?: string[] | undefined;
            }, {
                questions?: {
                    id: string;
                    label: string;
                    type: "text" | "textarea" | "select" | "checkbox" | "radio";
                    options?: string[] | undefined;
                    required?: boolean | undefined;
                    placeholder?: string | undefined;
                    validation?: {
                        minLength?: number | undefined;
                        maxLength?: number | undefined;
                        pattern?: string | undefined;
                    } | undefined;
                }[] | undefined;
                sections?: string[] | undefined;
            }>>;
            industry: z.ZodOptional<z.ZodString>;
            isPublic: z.ZodOptional<z.ZodBoolean>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            name?: string | undefined;
            description?: string | undefined;
            tags?: string[] | undefined;
            structure?: {
                questions?: {
                    id: string;
                    required: boolean;
                    label: string;
                    type: "text" | "textarea" | "select" | "checkbox" | "radio";
                    options?: string[] | undefined;
                    placeholder?: string | undefined;
                    validation?: {
                        minLength?: number | undefined;
                        maxLength?: number | undefined;
                        pattern?: string | undefined;
                    } | undefined;
                }[] | undefined;
                sections?: string[] | undefined;
            } | undefined;
            industry?: string | undefined;
            isPublic?: boolean | undefined;
        }, {
            name?: string | undefined;
            description?: string | undefined;
            tags?: string[] | undefined;
            structure?: {
                questions?: {
                    id: string;
                    label: string;
                    type: "text" | "textarea" | "select" | "checkbox" | "radio";
                    options?: string[] | undefined;
                    required?: boolean | undefined;
                    placeholder?: string | undefined;
                    validation?: {
                        minLength?: number | undefined;
                        maxLength?: number | undefined;
                        pattern?: string | undefined;
                    } | undefined;
                }[] | undefined;
                sections?: string[] | undefined;
            } | undefined;
            industry?: string | undefined;
            isPublic?: boolean | undefined;
        }>;
        filters: z.ZodObject<{
            search: z.ZodOptional<z.ZodString>;
            industry: z.ZodOptional<z.ZodString>;
            isPublic: z.ZodOptional<z.ZodBoolean>;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            page: z.ZodDefault<z.ZodNumber>;
            limit: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            page: number;
            limit: number;
            search?: string | undefined;
            tags?: string[] | undefined;
            industry?: string | undefined;
            isPublic?: boolean | undefined;
        }, {
            search?: string | undefined;
            page?: number | undefined;
            limit?: number | undefined;
            tags?: string[] | undefined;
            industry?: string | undefined;
            isPublic?: boolean | undefined;
        }>;
    };
    comment: {
        create: z.ZodObject<{
            content: z.ZodString;
            section: z.ZodString;
            position: z.ZodNumber;
            parentId: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            content: string;
            section: string;
            position: number;
            parentId?: string | undefined;
        }, {
            content: string;
            section: string;
            position: number;
            parentId?: string | undefined;
        }>;
        update: z.ZodObject<{
            content: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            content: string;
        }, {
            content: string;
        }>;
        resolve: z.ZodObject<{
            resolved: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            resolved: boolean;
        }, {
            resolved: boolean;
        }>;
    };
    collaboration: {
        operation: z.ZodObject<{
            type: z.ZodEnum<["insert", "delete", "replace"]>;
            section: z.ZodString;
            position: z.ZodNumber;
            content: z.ZodOptional<z.ZodString>;
            length: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            type: "replace" | "insert" | "delete";
            section: string;
            position: number;
            length?: number | undefined;
            content?: string | undefined;
        }, {
            type: "replace" | "insert" | "delete";
            section: string;
            position: number;
            length?: number | undefined;
            content?: string | undefined;
        }>;
        presence: z.ZodObject<{
            type: z.ZodEnum<["cursor", "selection", "typing", "idle"]>;
            data: z.ZodObject<{
                section: z.ZodOptional<z.ZodString>;
                position: z.ZodOptional<z.ZodNumber>;
                start: z.ZodOptional<z.ZodNumber>;
                end: z.ZodOptional<z.ZodNumber>;
                isTyping: z.ZodOptional<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                end?: number | undefined;
                section?: string | undefined;
                position?: number | undefined;
                start?: number | undefined;
                isTyping?: boolean | undefined;
            }, {
                end?: number | undefined;
                section?: string | undefined;
                position?: number | undefined;
                start?: number | undefined;
                isTyping?: boolean | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            data: {
                end?: number | undefined;
                section?: string | undefined;
                position?: number | undefined;
                start?: number | undefined;
                isTyping?: boolean | undefined;
            };
            type: "cursor" | "selection" | "typing" | "idle";
        }, {
            data: {
                end?: number | undefined;
                section?: string | undefined;
                position?: number | undefined;
                start?: number | undefined;
                isTyping?: boolean | undefined;
            };
            type: "cursor" | "selection" | "typing" | "idle";
        }>;
    };
    file: {
        upload: z.ZodObject<{
            type: z.ZodEnum<["avatar", "document", "template"]>;
            filename: z.ZodString;
            contentType: z.ZodEnum<["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "text/plain", "text/markdown"]>;
            size: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            type: "avatar" | "document" | "template";
            filename: string;
            contentType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "application/pdf" | "text/plain" | "text/markdown";
            size: number;
        }, {
            type: "avatar" | "document" | "template";
            filename: string;
            contentType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "application/pdf" | "text/plain" | "text/markdown";
            size: number;
        }>;
    };
    onboarding: {
        updateStep: z.ZodObject<{
            step: z.ZodEnum<["account_setup", "team_creation", "first_prd", "collaboration", "completed"]>;
            data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            step: "account_setup" | "team_creation" | "first_prd" | "collaboration" | "completed";
            data?: Record<string, any> | undefined;
        }, {
            step: "account_setup" | "team_creation" | "first_prd" | "collaboration" | "completed";
            data?: Record<string, any> | undefined;
        }>;
        completeOnboarding: z.ZodObject<{
            feedback: z.ZodOptional<z.ZodString>;
            rating: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            feedback?: string | undefined;
            rating?: number | undefined;
        }, {
            feedback?: string | undefined;
            rating?: number | undefined;
        }>;
    };
    notification: {
        create: z.ZodObject<{
            type: z.ZodEnum<["comment", "mention", "invite", "update"]>;
            title: z.ZodString;
            message: z.ZodString;
            recipientId: z.ZodString;
            metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        }, "strip", z.ZodTypeAny, {
            title: string;
            type: "update" | "comment" | "mention" | "invite";
            message: string;
            recipientId: string;
            metadata?: Record<string, any> | undefined;
        }, {
            title: string;
            type: "update" | "comment" | "mention" | "invite";
            message: string;
            recipientId: string;
            metadata?: Record<string, any> | undefined;
        }>;
        markRead: z.ZodObject<{
            notificationIds: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            notificationIds: string[];
        }, {
            notificationIds: string[];
        }>;
        filters: z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<["comment", "mention", "invite", "update"]>>;
            read: z.ZodOptional<z.ZodBoolean>;
            page: z.ZodDefault<z.ZodNumber>;
            limit: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            page: number;
            limit: number;
            type?: "update" | "comment" | "mention" | "invite" | undefined;
            read?: boolean | undefined;
        }, {
            page?: number | undefined;
            limit?: number | undefined;
            type?: "update" | "comment" | "mention" | "invite" | undefined;
            read?: boolean | undefined;
        }>;
    };
};
export type AuthRegisterData = z.infer<typeof authSchemas.register>;
export type AuthLoginData = z.infer<typeof authSchemas.login>;
export type TeamCreateData = z.infer<typeof teamSchemas.create>;
export type TeamUpdateData = z.infer<typeof teamSchemas.update>;
export type PRDCreateData = z.infer<typeof prdSchemas.create>;
export type PRDUpdateData = z.infer<typeof prdSchemas.update>;
export type PRDFiltersData = z.infer<typeof prdSchemas.filters>;
export type TemplateCreateData = z.infer<typeof templateSchemas.create>;
export type CommentCreateData = z.infer<typeof commentSchemas.create>;
export type AnalyticsEventData = z.infer<typeof analyticsSchemas.trackEvent>;
export type RegisterFormData = z.infer<typeof authSchemas.registerWithConfirm>;
export type UpdatePasswordFormData = z.infer<typeof authSchemas.updatePassword>;
/**
 * Validate data against a schema and return typed result
 */
export declare function validateData<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: true;
    data: T;
} | {
    success: false;
    errors: string[];
};
/**
 * Create a validation function for a specific schema
 */
export declare function createValidator<T>(schema: z.ZodSchema<T>): (data: unknown) => {
    success: false;
    errors: string[];
} | {
    success: true;
    data: T;
};
//# sourceMappingURL=validation.d.ts.map