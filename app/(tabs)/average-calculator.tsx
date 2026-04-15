// Average Calculator Screen
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import {
  BackgroundPrimary,
  TextPrimary,
  TextSecondary,
  PrimaryBlue,
  Colors,
  RadiusMedium,
  RadiusFull,
} from '@/constants/theme';
import apiClient from '@/config/api';

interface SchemaField {
  id?: number;
  name: string;
  weight: number;
  order?: number;
}

interface FieldGrade {
  id: number;
  field_name: string;
  field_weight: number;
  grade: number | null;
}

interface UserSchemaGrades {
  id: number;
  current_schema: boolean;
  schema: {
    id: number;
    name: string;
    description?: string;
    is_public: boolean;
    created_by: number;
    creator_name?: string;
    fields: SchemaField[];
    created_at: string;
    usage_count?: number;
  };
  field_grades: FieldGrade[];
}

interface SchemaListItem {
  id: number;
  name: string;
  description?: string;
  is_public: boolean;
  creator: number; // User ID
  creator_full_name?: string;
  creator_username?: string;
  created_by?: number; // Legacy support
  creator_name?: string; // Legacy support
  created_at: string;
  updated_at?: string;
  usage_count?: number;
  is_saved_by_user: boolean;
  fields: SchemaField[];
}

export default function AverageCalculatorScreen() {
  const [activeTab, setActiveTab] = useState<'average' | 'my-schemas' | 'public-schemas'>(
    'average',
  );
  const [currentUserSchemaGrades, setCurrentUserSchemaGrades] = useState<UserSchemaGrades | null>(
    null,
  );
  const [mySchemas, setMySchemas] = useState<SchemaListItem[]>([]);
  const [publicSchemas, setPublicSchemas] = useState<SchemaListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [savingFields, setSavingFields] = useState<Set<number>>(new Set());
  const [localGrades, setLocalGrades] = useState<Record<number, string>>({});
  const [isEditingSchema, setIsEditingSchema] = useState(false); // Track if we're creating/editing vs using
  const [publicSchemasPage, setPublicSchemasPage] = useState(1);
  const [hasMorePublicSchemas, setHasMorePublicSchemas] = useState(true);
  const debounceTimersRef = useRef<Record<number, NodeJS.Timeout>>({});
  const insets = useSafeAreaInsets();
  const { toast, showSuccess, showError, hideToast } = useToast();

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Load current schema on mount
  useEffect(() => {
    if (activeTab === 'average') {
      loadCurrentSchema();
    } else if (activeTab === 'my-schemas' || activeTab === 'public-schemas') {
      loadSchemas(true); // Reset pagination when tab or search changes
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, debouncedSearch]);

  const loadCurrentSchema = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/average/current-schema/');
      const data = response.data;
      if (data) {
        setCurrentUserSchemaGrades(data);
        setIsEditingSchema(false); // Loaded schemas are in read-only mode
        // Initialize local grades from field_grades
        const gradesMap: Record<number, string> = {};
        data.field_grades?.forEach((fg: FieldGrade) => {
          if (fg.grade !== null && fg.grade !== undefined) {
            gradesMap[fg.id] = fg.grade.toString();
          }
        });
        setLocalGrades(gradesMap);
      } else {
        setCurrentUserSchemaGrades(null);
        setIsEditingSchema(false);
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error loading current schema:', error);
        showError('Failed to load current schema');
      }
      setCurrentUserSchemaGrades(null);
      setIsEditingSchema(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadSchemas = async (reset = false, loadMore = false) => {
    if (loading && !loadMore) return;

    // For loadMore, use the next page (current page + 1)
    // For reset, start from page 1
    const currentPage = reset ? 1 : loadMore ? publicSchemasPage + 1 : publicSchemasPage;

    if (!loadMore) {
      setLoading(true);
    }

    try {
      if (activeTab === 'my-schemas') {
        const response = await apiClient.get('/average/my-schemas/');
        const schemas = response.data?.results || response.data || [];
        setMySchemas(Array.isArray(schemas) ? schemas : []);
      } else {
        // Public schemas with pagination
        const params: any = {
          page: currentPage,
          page_size: 20,
        };

        if (debouncedSearch.trim()) {
          params.search = debouncedSearch.trim();
        }

        const response = await apiClient.get('/average/public-schemas/', { params });
        const data = response.data;
        const schemas = data?.results || data || [];

        // Normalize schemas to match our interface
        const normalizedSchemas = Array.isArray(schemas)
          ? schemas.map((schema: any) => ({
              ...schema,
              // Map creator fields: API uses creator (id), creator_full_name, creator_username
              creator: schema.creator || schema.created_by || 0,
              creator_full_name: schema.creator_full_name || schema.creator_name || undefined,
              creator_username: schema.creator_username || undefined,
              // Legacy support
              created_by: schema.creator || schema.created_by || 0,
              creator_name: schema.creator_full_name || schema.creator_name || undefined,
            }))
          : [];

        if (reset || !loadMore) {
          setPublicSchemas(normalizedSchemas);
          setPublicSchemasPage(reset ? 1 : currentPage);
        } else {
          setPublicSchemas((prev) => [...prev, ...normalizedSchemas]);
          setPublicSchemasPage(currentPage);
        }

        // Handle pagination
        setHasMorePublicSchemas(!!data?.next);
      }
    } catch (error: any) {
      console.error('Error loading schemas:', error);
      showError('Failed to load schemas');
      if (activeTab === 'my-schemas') {
        setMySchemas([]);
      } else {
        setPublicSchemas([]);
      }
    } finally {
      if (!loadMore) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  };

  const calculateAverage = (fieldGrades: FieldGrade[]): number | null => {
    const validGrades = fieldGrades.filter((fg) => fg.grade !== null && fg.grade !== undefined);
    if (validGrades.length === 0) return null;

    const totalWeightedScore = validGrades.reduce(
      (sum, fg) => sum + fg.grade! * fg.field_weight,
      0,
    );
    const totalWeight = validGrades.reduce((sum, fg) => sum + fg.field_weight, 0);

    return totalWeight > 0 ? totalWeightedScore / totalWeight : null;
  };

  const getAverageStatus = (average: number): { label: string; color: string; bgColor: string } => {
    if (average >= 13.5)
      return {
        label: 'Excellent',
        color: Colors.light.success,
        bgColor: `${Colors.light.success}20`,
      };
    if (average >= 11.5) return { label: 'Good', color: PrimaryBlue, bgColor: `${PrimaryBlue}20` };
    if (average >= 10)
      return { label: 'Enough', color: Colors.light.warning, bgColor: `${Colors.light.warning}20` };
    return { label: 'Fail', color: Colors.light.error, bgColor: `${Colors.light.error}20` };
  };

  const updateGrade = useCallback(
    async (fieldGradeId: number, grade: string) => {
      const parsedGrade = grade === '' ? null : parseFloat(grade);

      if (grade !== '' && (isNaN(parsedGrade!) || parsedGrade! < 0 || parsedGrade! > 20)) {
        return; // Invalid grade, don't save
      }

      setSavingFields((prev) => new Set(prev).add(fieldGradeId));

      try {
        await apiClient.put(`/average/update-grade/${fieldGradeId}/`, {
          grade: parsedGrade,
        });

        // Update local state
        setCurrentUserSchemaGrades((prev) => {
          if (!prev) return null;
          const updated = {
            ...prev,
            field_grades: prev.field_grades.map((fg) =>
              fg.id === fieldGradeId ? { ...fg, grade: parsedGrade } : fg,
            ),
          };
          return updated;
        });
      } catch (error: any) {
        console.error('Error updating grade:', error);
        showError('Failed to save grade');
        // Revert local grade
        setLocalGrades((prev) => {
          const updated = { ...prev };
          if (currentUserSchemaGrades) {
            const fg = currentUserSchemaGrades.field_grades.find((fg) => fg.id === fieldGradeId);
            updated[fieldGradeId] = fg?.grade?.toString() || '';
          }
          return updated;
        });
      } finally {
        setSavingFields((prev) => {
          const newSet = new Set(prev);
          newSet.delete(fieldGradeId);
          return newSet;
        });
      }
    },
    [currentUserSchemaGrades, showError],
  );

  // Debounced update grade function
  const debouncedUpdateGrade = useCallback(
    (fieldGradeId: number, grade: string) => {
      if (debounceTimersRef.current[fieldGradeId]) {
        clearTimeout(debounceTimersRef.current[fieldGradeId]);
      }
      debounceTimersRef.current[fieldGradeId] = setTimeout(() => {
        updateGrade(fieldGradeId, grade);
        delete debounceTimersRef.current[fieldGradeId];
      }, 800);
    },
    [updateGrade],
  );

  const handleGradeChange = (fieldGradeId: number, value: string) => {
    // Update local state immediately
    setLocalGrades((prev) => ({ ...prev, [fieldGradeId]: value }));
    // Debounce API call
    debouncedUpdateGrade(fieldGradeId, value);
  };

  const createNewSchema = () => {
    setIsEditingSchema(true);
    const newSchema: UserSchemaGrades = {
      id: 0,
      current_schema: true,
      schema: {
        id: 0,
        name: 'New Schema',
        description: '',
        is_public: false,
        created_by: 0,
        fields: [{ name: '', weight: 1 }],
        created_at: new Date().toISOString(),
      },
      field_grades: [],
    };
    setCurrentUserSchemaGrades(newSchema);
  };

  const addField = () => {
    if (!currentUserSchemaGrades) {
      createNewSchema();
      return;
    }

    setCurrentUserSchemaGrades({
      ...currentUserSchemaGrades,
      schema: {
        ...currentUserSchemaGrades.schema,
        fields: [...currentUserSchemaGrades.schema.fields, { name: '', weight: 1 }],
      },
    });
  };

  const removeField = (index: number) => {
    if (!currentUserSchemaGrades) return;
    if (currentUserSchemaGrades.schema.fields.length <= 1) {
      Alert.alert('Error', 'You must have at least one field');
      return;
    }

    const newFields = currentUserSchemaGrades.schema.fields.filter((_, i) => i !== index);
    setCurrentUserSchemaGrades({
      ...currentUserSchemaGrades,
      schema: {
        ...currentUserSchemaGrades.schema,
        fields: newFields,
      },
    });
  };

  const updateFieldName = (index: number, name: string) => {
    if (!currentUserSchemaGrades) return;
    const newFields = [...currentUserSchemaGrades.schema.fields];
    newFields[index] = { ...newFields[index], name };
    setCurrentUserSchemaGrades({
      ...currentUserSchemaGrades,
      schema: { ...currentUserSchemaGrades.schema, fields: newFields },
    });
  };

  const updateFieldWeight = (index: number, weight: string) => {
    if (!currentUserSchemaGrades) return;
    const parsedWeight = parseFloat(weight) || 0.1;
    const newFields = [...currentUserSchemaGrades.schema.fields];
    newFields[index] = { ...newFields[index], weight: Math.max(0.1, parsedWeight) };
    setCurrentUserSchemaGrades({
      ...currentUserSchemaGrades,
      schema: { ...currentUserSchemaGrades.schema, fields: newFields },
    });
  };

  const saveSchema = async () => {
    if (!currentUserSchemaGrades) {
      showError('No schema to save');
      return;
    }

    const schema = currentUserSchemaGrades.schema;
    if (!schema.name || schema.name.trim() === '') {
      showError('Please enter a schema name');
      return;
    }

    const validFields = schema.fields.filter((f) => f.name && f.name.trim() !== '' && f.weight > 0);
    if (validFields.length === 0) {
      showError('Please add at least one field with a name and weight > 0');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/average/create-schema/', {
        name: schema.name,
        description: schema.description || '',
        fields: validFields.map((f) => ({ name: f.name, weight: f.weight })),
      });
      showSuccess('Schema created successfully');
      setIsEditingSchema(false); // Exit edit mode after saving
      // Reload current schema and my schemas
      await Promise.all([loadCurrentSchema(), loadSchemas()]);
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to save schema');
    } finally {
      setLoading(false);
    }
  };

  const applySchema = async (schemaId: number) => {
    try {
      setLoading(true);
      setIsEditingSchema(false); // Set to read-only mode when using a schema
      const response = await apiClient.post(`/average/use-schema/${schemaId}/`);
      const data = response.data;

      if (!data) {
        showError('Invalid schema data received');
        setLoading(false);
        return;
      }

      setCurrentUserSchemaGrades(data);
      // Initialize local grades
      const gradesMap: Record<number, string> = {};
      data.field_grades?.forEach((fg: FieldGrade) => {
        if (fg.grade !== null && fg.grade !== undefined) {
          gradesMap[fg.id] = fg.grade.toString();
        }
      });
      setLocalGrades(gradesMap);

      setActiveTab('average');
      showSuccess('Schema loaded successfully');
    } catch (error: any) {
      console.error('Error using schema:', error);
      showError(error.response?.data?.detail || 'Failed to load schema');
    } finally {
      setLoading(false);
    }
  };

  const savePublicSchema = async (schemaId: number) => {
    try {
      await apiClient.post(`/average/save-schema/${schemaId}/`);
      showSuccess('Schema saved to My Schemas');
      loadSchemas();
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to save schema');
    }
  };

  const unsaveSchema = async (schemaId: number) => {
    try {
      await apiClient.delete(`/average/unsave-schema/${schemaId}/`);
      showSuccess('Schema removed from My Schemas');
      loadSchemas();
      if (activeTab === 'my-schemas') {
        // Reload my schemas
        const response = await apiClient.get('/average/my-schemas/');
        const schemas = response.data?.results || response.data || [];
        setMySchemas(Array.isArray(schemas) ? schemas : []);
      }
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to unsave schema');
    }
  };

  const deleteSchema = async (schemaId: number) => {
    Alert.alert(
      'Delete Schema',
      'Are you sure you want to delete this schema? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/average/delete-schema/${schemaId}/`);
              showSuccess('Schema deleted successfully');
              loadSchemas();
            } catch (error: any) {
              showError(error.response?.data?.detail || 'Failed to delete schema');
            }
          },
        },
      ],
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'average') {
      await loadCurrentSchema();
    } else {
      setPublicSchemasPage(1);
      await loadSchemas(true);
    }
  };

  const average = currentUserSchemaGrades
    ? calculateAverage(currentUserSchemaGrades.field_grades)
    : null;

  const status = average !== null ? getAverageStatus(average) : null;
  const validGrades = currentUserSchemaGrades?.field_grades.filter((fg) => fg.grade !== null) || [];
  const completedCount = validGrades.length;
  const totalFields = currentUserSchemaGrades?.schema.fields.length || 0;
  const progress = totalFields > 0 ? (completedCount / totalFields) * 100 : 0;

  const renderSchemaCard = (schema: SchemaListItem) => (
    <Card key={schema.id} style={styles.schemaCard}>
      <View style={styles.schemaHeader}>
        <View style={styles.schemaInfo}>
          <View style={styles.schemaNameRow}>
            <Text style={styles.schemaName}>{schema.name}</Text>
            <View style={styles.schemaIcons}>
              {schema.is_public && (
                <Ionicons name="globe" size={16} color={Colors.light.success} style={styles.icon} />
              )}
              {!schema.is_public && (schema.creator || schema.created_by) && (
                <Ionicons name="lock-closed" size={16} color={TextSecondary} style={styles.icon} />
              )}
              {schema.is_saved_by_user && (
                <Ionicons name="heart" size={16} color={Colors.light.error} style={styles.icon} />
              )}
            </View>
          </View>
          {(schema.creator_full_name || schema.creator_name || schema.creator_username) && (
            <Text style={styles.creatorName}>
              by{' '}
              {schema.creator_full_name ||
                schema.creator_name ||
                schema.creator_username ||
                `User ${schema.creator || schema.created_by}`}
            </Text>
          )}
          {schema.description && (
            <Text style={styles.schemaDescription} numberOfLines={2}>
              {schema.description}
            </Text>
          )}
          <View style={styles.schemaStats}>
            <Text style={styles.statText}>Fields: {schema.fields?.length || 0}</Text>
            {schema.usage_count !== undefined && (
              <>
                <Text style={styles.statSeparator}> • </Text>
                <Text style={styles.statText}>Used {schema.usage_count} times</Text>
              </>
            )}
          </View>
        </View>
      </View>

      {schema.fields && schema.fields.length > 0 && (
        <View style={styles.fieldsPreview}>
          <Text style={styles.fieldsPreviewTitle}>Fields:</Text>
          {schema.fields.slice(0, 3).map((field, index) => (
            <View key={field.id || `field-${index}`} style={styles.fieldPreviewRow}>
              <Text style={styles.fieldPreviewName} numberOfLines={1}>
                {field.name}
              </Text>
              <Text style={styles.fieldPreviewWeight}>×{field.weight}</Text>
            </View>
          ))}
          {schema.fields.length > 3 && (
            <Text style={styles.moreFields}>+{schema.fields.length - 3} more...</Text>
          )}
        </View>
      )}

      <View style={styles.schemaActions}>
        <Button
          title="Use"
          onPress={() => applySchema(schema.id)}
          size="sm"
          style={styles.useButton}
        />
        {activeTab === 'public-schemas' && (
          <TouchableOpacity
            onPress={() =>
              schema.is_saved_by_user ? unsaveSchema(schema.id) : savePublicSchema(schema.id)
            }
            style={styles.iconButton}
          >
            <Ionicons
              name={schema.is_saved_by_user ? 'heart' : 'heart-outline'}
              size={20}
              color={schema.is_saved_by_user ? Colors.light.error : TextSecondary}
            />
          </TouchableOpacity>
        )}
        {activeTab === 'my-schemas' && (schema.creator || schema.created_by) && (
          <>
            {schema.is_saved_by_user && (
              <TouchableOpacity onPress={() => unsaveSchema(schema.id)} style={styles.iconButton}>
                <Ionicons name="heart-dislike" size={20} color={Colors.light.error} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => deleteSchema(schema.id)} style={styles.iconButton}>
              <Ionicons name="trash" size={20} color={Colors.light.error} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </Card>
  );

  const filteredSchemas =
    activeTab === 'public-schemas' ? publicSchemas : activeTab === 'my-schemas' ? mySchemas : [];

  return (
    <View style={styles.container}>
      <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.screenTitle}>Average Calculator</Text>
        <View style={styles.tabs}>
          {[
            { key: 'average' as const, label: 'Average' },
            { key: 'my-schemas' as const, label: 'My Schemas' },
            { key: 'public-schemas' as const, label: 'Public' },
          ].map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              style={[styles.tab, activeTab === t.key && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {activeTab === 'average' && (
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          {loading && !currentUserSchemaGrades ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={PrimaryBlue} />
            </View>
          ) : (
            <View style={styles.averageContent}>
              {/* Input Section */}
              <View style={styles.inputSection}>
                <Card style={styles.inputCard}>
                  <View style={styles.schemaHeaderRow}>
                    <Text style={styles.sectionTitle}>Schema</Text>
                    <TouchableOpacity onPress={createNewSchema} style={styles.newSchemaButton}>
                      <Ionicons name="add-circle" size={24} color={PrimaryBlue} />
                      <Text style={styles.newSchemaText}>New Schema</Text>
                    </TouchableOpacity>
                  </View>

                  {currentUserSchemaGrades ? (
                    <>
                      {isEditingSchema ? (
                        // Edit Mode: Allow editing schema structure
                        <>
                          <Input
                            label="Schema Name"
                            placeholder="Enter schema name"
                            value={currentUserSchemaGrades.schema.name}
                            onChangeText={(text) =>
                              setCurrentUserSchemaGrades({
                                ...currentUserSchemaGrades,
                                schema: { ...currentUserSchemaGrades.schema, name: text },
                              })
                            }
                            style={styles.input}
                          />

                          <Input
                            label="Description"
                            placeholder="Optional description"
                            value={currentUserSchemaGrades.schema.description || ''}
                            onChangeText={(text) =>
                              setCurrentUserSchemaGrades({
                                ...currentUserSchemaGrades,
                                schema: { ...currentUserSchemaGrades.schema, description: text },
                              })
                            }
                            style={styles.input}
                            multiline
                          />

                          <View style={styles.fieldsSection}>
                            <View style={styles.fieldsHeader}>
                              <Text style={styles.fieldsTitle}>Fields</Text>
                              <TouchableOpacity onPress={addField} style={styles.addFieldButton}>
                                <Ionicons name="add-circle" size={20} color={PrimaryBlue} />
                              </TouchableOpacity>
                            </View>

                            {currentUserSchemaGrades.schema.fields.map((field, index) => (
                              <Card key={index} style={styles.fieldCard}>
                                <View style={styles.fieldHeader}>
                                  <Text style={styles.fieldNumber}>Field #{index + 1}</Text>
                                  {currentUserSchemaGrades.schema.fields.length > 1 && (
                                    <TouchableOpacity
                                      onPress={() => removeField(index)}
                                      style={styles.removeButton}
                                    >
                                      <Ionicons
                                        name="close-circle"
                                        size={20}
                                        color={Colors.light.error}
                                      />
                                    </TouchableOpacity>
                                  )}
                                </View>

                                <Input
                                  label="Field Name"
                                  placeholder="e.g., Midterm, Final"
                                  value={field.name}
                                  onChangeText={(text) => updateFieldName(index, text)}
                                  style={styles.input}
                                />

                                <Input
                                  label="Weight"
                                  placeholder="1.0"
                                  value={field.weight.toString()}
                                  onChangeText={(text) => updateFieldWeight(index, text)}
                                  keyboardType="decimal-pad"
                                  style={styles.input}
                                />
                              </Card>
                            ))}
                          </View>

                          <Button
                            title="Save Schema"
                            onPress={saveSchema}
                            loading={loading}
                            style={styles.saveButton}
                          />
                        </>
                      ) : (
                        // Read-Only Mode: Show schema info and grade inputs
                        <>
                          <View style={styles.readOnlySchema}>
                            <Text style={styles.readOnlyLabel}>Schema Name</Text>
                            <Text style={styles.readOnlyValue}>
                              {currentUserSchemaGrades.schema.name}
                            </Text>
                          </View>

                          {currentUserSchemaGrades.schema.description && (
                            <View style={styles.readOnlySchema}>
                              <Text style={styles.readOnlyLabel}>Description</Text>
                              <Text style={styles.readOnlyValue}>
                                {currentUserSchemaGrades.schema.description}
                              </Text>
                            </View>
                          )}

                          {/* Grade Inputs - only show when not editing */}
                          {currentUserSchemaGrades.field_grades.length > 0 && (
                            <View style={styles.gradesSection}>
                              <Text style={styles.gradesTitle}>Enter Grades</Text>
                              {currentUserSchemaGrades.field_grades.map((fg) => {
                                const isSaving = savingFields.has(fg.id);
                                const localValue =
                                  localGrades[fg.id] ?? (fg.grade?.toString() || '');
                                return (
                                  <Card
                                    key={fg.id}
                                    style={[styles.gradeCard, isSaving && styles.gradeCardSaving]}
                                  >
                                    <View style={styles.gradeHeader}>
                                      <View>
                                        <Text style={styles.gradeFieldName}>{fg.field_name}</Text>
                                        <Text style={styles.gradeWeight}>
                                          Weight: {fg.field_weight}
                                          {localValue &&
                                            ` • Contribution: ${(parseFloat(localValue) * fg.field_weight).toFixed(1)}`}
                                        </Text>
                                      </View>
                                      {isSaving && (
                                        <View style={styles.savingIndicator}>
                                          <ActivityIndicator
                                            size="small"
                                            color={Colors.light.warning}
                                          />
                                        </View>
                                      )}
                                    </View>

                                    <Input
                                      placeholder="0-20"
                                      value={localValue}
                                      onChangeText={(value) => handleGradeChange(fg.id, value)}
                                      keyboardType="decimal-pad"
                                      style={[
                                        styles.gradeInput,
                                        isSaving && styles.gradeInputSaving,
                                      ]}
                                    />
                                    {isSaving && <Text style={styles.savingText}>Saving...</Text>}
                                  </Card>
                                );
                              })}
                            </View>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <Card style={styles.emptyCard}>
                      <Ionicons name="calculator-outline" size={48} color={TextSecondary} />
                      <Text style={styles.emptyText}>No schema loaded</Text>
                      <Text style={styles.emptySubtext}>
                        Create a new schema or use one from My Schemas or Public Schemas
                      </Text>
                      <Button
                        title="Create New Schema"
                        onPress={createNewSchema}
                        style={styles.createButton}
                      />
                    </Card>
                  )}
                </Card>
              </View>

              {/* Results Section */}
              {average !== null && (
                <View style={styles.resultsSection}>
                  <Card style={styles.resultCard}>
                    <Text style={styles.resultLabel}>Weighted Average</Text>
                    <Text style={styles.resultValue}>{average.toFixed(2)}</Text>
                    {status && (
                      <Badge
                        label={status.label}
                        variant={
                          status.label === 'Excellent'
                            ? 'success'
                            : status.label === 'Good'
                              ? 'primary'
                              : status.label === 'Enough'
                                ? 'warning'
                                : 'error'
                        }
                        style={[styles.statusBadge, { backgroundColor: status.bgColor }]}
                        textStyle={{ color: status.color }}
                      />
                    )}
                  </Card>

                  <Card style={styles.statsCard}>
                    <Text style={styles.statsTitle}>Statistics</Text>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Total Fields:</Text>
                      <Text style={styles.statValue}>{totalFields}</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Completed:</Text>
                      <Text style={styles.statValue}>{completedCount}</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Progress:</Text>
                      <Text style={styles.statValue}>{progress.toFixed(0)}%</Text>
                    </View>
                    {validGrades.length > 0 && (
                      <>
                        <View style={styles.statRow}>
                          <Text style={styles.statLabel}>Highest:</Text>
                          <Text style={styles.statValue}>
                            {Math.max(...validGrades.map((fg) => fg.grade!)).toFixed(2)}
                          </Text>
                        </View>
                        <View style={styles.statRow}>
                          <Text style={styles.statLabel}>Lowest:</Text>
                          <Text style={styles.statValue}>
                            {Math.min(...validGrades.map((fg) => fg.grade!)).toFixed(2)}
                          </Text>
                        </View>
                      </>
                    )}
                  </Card>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {(activeTab === 'my-schemas' || activeTab === 'public-schemas') && (
        <View style={styles.schemasView}>
          {activeTab === 'public-schemas' && (
            <Card style={styles.searchCard}>
              <Input
                placeholder="Search schemas..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />
            </Card>
          )}

          {loading && filteredSchemas.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={PrimaryBlue} />
            </View>
          ) : filteredSchemas.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons
                name={activeTab === 'public-schemas' ? 'globe-outline' : 'document-text-outline'}
                size={48}
                color={TextSecondary}
              />
              <Text style={styles.emptyText}>
                {activeTab === 'public-schemas'
                  ? searchQuery
                    ? 'No schemas found'
                    : 'No public schemas available'
                  : 'No schemas found'}
              </Text>
              <Text style={styles.emptySubtext}>
                {activeTab === 'public-schemas'
                  ? searchQuery
                    ? 'Try a different search term'
                    : 'Be the first to share a public schema!'
                  : 'Create a new schema in the Average tab'}
              </Text>
            </Card>
          ) : (
            <FlatList
              data={filteredSchemas}
              renderItem={({ item }) => renderSchemaCard(item)}
              keyExtractor={(item, index) => item.id?.toString() || `schema-${index}`}
              contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              onEndReached={() => {
                if (
                  activeTab === 'public-schemas' &&
                  hasMorePublicSchemas &&
                  !loading &&
                  !refreshing
                ) {
                  loadSchemas(false, true);
                }
              }}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                activeTab === 'public-schemas' && loading && filteredSchemas.length > 0 ? (
                  <View style={styles.footerLoading}>
                    <ActivityIndicator size="small" color={PrimaryBlue} />
                  </View>
                ) : null
              }
            />
          )}
        </View>
      )}

      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={hideToast} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BackgroundPrimary,
  },
  headerBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: TextPrimary,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  tabs: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 10,
  },
  tab: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: RadiusFull,
  },
  tabActive: {
    backgroundColor: '#E8EDFB',
  },
  tabText: {
    fontSize: 13,
    color: TextSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: PrimaryBlue,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  averageContent: {
    padding: 16,
  },
  inputSection: {
    marginBottom: 16,
  },
  inputCard: {
    padding: 20,
  },
  schemaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TextPrimary,
    letterSpacing: -0.2,
  },
  newSchemaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newSchemaText: {
    fontSize: 14,
    color: PrimaryBlue,
    fontWeight: '600',
  },
  input: {
    marginBottom: 16,
  },
  fieldsSection: {
    marginTop: 8,
  },
  fieldsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fieldsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: TextPrimary,
  },
  addFieldButton: {
    padding: 4,
  },
  fieldCard: {
    marginBottom: 12,
    padding: 16,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fieldNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: TextPrimary,
  },
  removeButton: {
    padding: 4,
  },
  gradesSection: {
    marginTop: 16,
  },
  gradesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: TextPrimary,
    marginBottom: 12,
  },
  gradeCard: {
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  gradeCardSaving: {
    backgroundColor: '#FEF3C7',
    borderColor: Colors.light.warning,
  },
  gradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  gradeFieldName: {
    fontSize: 16,
    fontWeight: '600',
    color: TextPrimary,
    marginBottom: 4,
  },
  gradeWeight: {
    fontSize: 12,
    color: TextSecondary,
  },
  savingIndicator: {
    padding: 4,
  },
  gradeInput: {
    marginBottom: 0,
  },
  gradeInputSaving: {
    borderColor: Colors.light.warning,
  },
  savingText: {
    fontSize: 12,
    color: Colors.light.warning,
    marginTop: 4,
    fontStyle: 'italic',
  },
  saveButton: {
    marginTop: 16,
  },
  resultsSection: {
    marginTop: 16,
  },
  resultCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#E8EDFB',
  },
  resultLabel: {
    fontSize: 13,
    color: TextSecondary,
    marginBottom: 6,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  resultValue: {
    fontSize: 44,
    fontWeight: '700',
    color: PrimaryBlue,
    marginBottom: 10,
    letterSpacing: -1,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statsCard: {
    padding: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: TextPrimary,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    color: TextSecondary,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: TextPrimary,
  },
  schemasView: {
    flex: 1,
  },
  searchCard: {
    margin: 16,
    marginBottom: 8,
    padding: 12,
  },
  searchInput: {
    marginBottom: 0,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  schemaCard: {
    marginBottom: 16,
    padding: 20,
  },
  schemaHeader: {
    marginBottom: 12,
  },
  schemaInfo: {
    flex: 1,
  },
  schemaNameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  schemaName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: TextPrimary,
    marginRight: 8,
    flexShrink: 1,
    letterSpacing: -0.2,
  },
  schemaIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  icon: {
    marginLeft: 0,
  },
  creatorName: {
    fontSize: 12,
    color: TextSecondary,
    marginBottom: 4,
  },
  schemaDescription: {
    fontSize: 14,
    color: TextSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  schemaStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: TextSecondary,
  },
  statSeparator: {
    fontSize: 12,
    color: TextSecondary,
  },
  fieldsPreview: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  fieldsPreviewTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: TextPrimary,
    marginBottom: 8,
  },
  fieldPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  fieldPreviewName: {
    fontSize: 12,
    color: TextSecondary,
    flex: 1,
  },
  fieldPreviewWeight: {
    fontSize: 12,
    color: TextSecondary,
    marginLeft: 8,
  },
  moreFields: {
    fontSize: 12,
    color: TextSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  schemaActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  useButton: {
    flex: 1,
  },
  iconButton: {
    padding: 8,
  },
  emptyCard: {
    padding: 48,
    alignItems: 'center',
    margin: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: TextPrimary,
    marginTop: 14,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: TextSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    marginTop: 8,
  },
  footerLoading: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  readOnlySchema: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  readOnlyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: TextSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  readOnlyValue: {
    fontSize: 16,
    color: TextPrimary,
    lineHeight: 24,
  },
  readOnlyField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.subtle,
    borderRadius: RadiusMedium,
    marginBottom: 8,
  },
  readOnlyFieldName: {
    fontSize: 14,
    fontWeight: '500',
    color: TextPrimary,
    flex: 1,
  },
  readOnlyFieldWeight: {
    fontSize: 14,
    color: TextSecondary,
    marginLeft: 12,
  },
});
