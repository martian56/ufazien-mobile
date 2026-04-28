// GPA Calculator Screen
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Picker } from '@/components/ui/Picker';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { useThemedColors } from '@/contexts/ThemeContext';
import { RadiusMedium, RadiusFull, ThemeColors } from '@/constants/theme';
import {
  convertUFAZToGPA,
  convertAzerbaijanToGPA,
  getLetterGrade,
  getGPAStatus,
  ufazConversionTable,
} from '@/utils/gpaConversion';
import apiClient from '@/config/api';

interface GPAAverage {
  id: number;
  period: string;
  average: string;
  gradeType: 'ufaz' | 'azerbaijan' | 'gpa';
}

interface GPAStatistics {
  total_periods: number;
  average_gpa: number;
  highest_gpa: number;
  lowest_gpa: number;
  total_calculations?: number;
}

interface SavedCalculation {
  id: number;
  name: string;
  type: 'semester' | 'yearly';
  period_count: number;
  overall_gpa: number;
  created_at: string;
}

interface GPAResult {
  gpa: number;
  azerbaijanGrade: number;
  totalPeriods: number;
  averageScore: number;
  letterGrade: string;
}

export default function GPACalculatorScreen() {
  const c = useThemedColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'semester' | 'yearly' | 'history'>('semester');
  const [semesterAverages, setSemesterAverages] = useState<GPAAverage[]>([
    { id: Date.now(), period: '', average: '', gradeType: 'ufaz' },
  ]);
  const [yearlyAverages, setYearlyAverages] = useState<GPAAverage[]>([
    { id: Date.now(), period: '', average: '', gradeType: 'ufaz' },
  ]);
  const [gpaResult, setGpaResult] = useState<GPAResult | null>(null);
  const [statistics, setStatistics] = useState<GPAStatistics | null>(null);
  const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>([]);
  const [, setLoading] = useState(false);
  const [refreshing] = useState(false);
  const [inputSaving, setInputSaving] = useState(false);
  const [gpaSaving, setGpaSaving] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const { toast, showError, hideToast } = useToast();

  const inputSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gpaSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadInputState();
    loadStatistics();
    loadSavedCalculations();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    calculateCurrentGPA();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semesterAverages, yearlyAverages, activeTab]);

  useEffect(() => {
    if (isInitialLoad) return;

    if (inputSaveTimerRef.current) {
      clearTimeout(inputSaveTimerRef.current);
    }

    inputSaveTimerRef.current = setTimeout(() => {
      saveInputState();
    }, 3000);

    return () => {
      if (inputSaveTimerRef.current) {
        clearTimeout(inputSaveTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semesterAverages, yearlyAverages, activeTab, isInitialLoad]);

  useEffect(() => {
    if (isInitialLoad || !gpaResult || gpaResult.totalPeriods === 0 || gpaResult.gpa === 0) {
      return;
    }

    if (gpaSaveTimerRef.current) {
      clearTimeout(gpaSaveTimerRef.current);
    }

    gpaSaveTimerRef.current = setTimeout(() => {
      saveGPA();
    }, 2000);

    return () => {
      if (gpaSaveTimerRef.current) {
        clearTimeout(gpaSaveTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpaResult, isInitialLoad]);

  const loadInputState = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/gpa/input-state/');
      const data = response.data;
      if (data) {
        if (data.active_tab) {
          setActiveTab(data.active_tab as 'semester' | 'yearly' | 'history');
        }
        if (
          data.semester_data &&
          Array.isArray(data.semester_data) &&
          data.semester_data.length > 0
        ) {
          setSemesterAverages(
            data.semester_data.map((item: any) => ({
              id: item.id || Date.now() + Math.random(),
              period: item.period || '',
              average: item.average?.toString() || '',
              gradeType: item.gradeType || 'ufaz',
            })),
          );
        } else {
          setSemesterAverages([{ id: Date.now(), period: '', average: '', gradeType: 'ufaz' }]);
        }
        if (data.yearly_data && Array.isArray(data.yearly_data) && data.yearly_data.length > 0) {
          setYearlyAverages(
            data.yearly_data.map((item: any) => ({
              id: item.id || Date.now() + Math.random(),
              period: item.period || '',
              average: item.average?.toString() || '',
              gradeType: item.gradeType || 'ufaz',
            })),
          );
        } else {
          setYearlyAverages([{ id: Date.now(), period: '', average: '', gradeType: 'ufaz' }]);
        }
      } else {
        setSemesterAverages([{ id: Date.now(), period: '', average: '', gradeType: 'ufaz' }]);
        setYearlyAverages([{ id: Date.now(), period: '', average: '', gradeType: 'ufaz' }]);
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error loading input state:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await apiClient.get('/gpa/statistics/');
      setStatistics(response.data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const loadSavedCalculations = async () => {
    try {
      const response = await apiClient.get('/gpa/calculations/');
      const calculations = response.data?.results || response.data || [];
      setSavedCalculations(Array.isArray(calculations) ? calculations : []);
    } catch (error) {
      console.error('Error loading saved calculations:', error);
    }
  };

  const calculateCurrentGPA = () => {
    const currentAverages = activeTab === 'semester' ? semesterAverages : yearlyAverages;

    const validAverages = currentAverages.filter(
      (avg) => avg.period && avg.period.trim() && avg.average && avg.average.trim(),
    );

    if (validAverages.length === 0) {
      setGpaResult(null);
      return;
    }

    let totalGPA = 0;
    let totalAzerbaijanGrade = 0;
    let totalAverageScore = 0;

    validAverages.forEach((avg) => {
      const average = parseFloat(avg.average);
      if (isNaN(average)) return;

      let gpaPoints = 0;
      let azerbaijanEquivalent = 0;

      if (avg.gradeType === 'ufaz') {
        const conversion = convertUFAZToGPA(average);
        gpaPoints = conversion.gpa;
        azerbaijanEquivalent = conversion.azerbaijanEquivalent;
      } else if (avg.gradeType === 'azerbaijan') {
        const conversion = convertAzerbaijanToGPA(average);
        gpaPoints = conversion.gpa;
        azerbaijanEquivalent = average;
      } else if (avg.gradeType === 'gpa') {
        gpaPoints = average;
        azerbaijanEquivalent = average >= 3.7 ? 90 : average >= 3.0 ? 80 : average >= 2.0 ? 60 : 50;
      }

      totalGPA += gpaPoints;
      totalAzerbaijanGrade += azerbaijanEquivalent;
      totalAverageScore += average;
    });

    const finalGPA = totalGPA / validAverages.length;
    const finalAzerbaijanGrade = totalAzerbaijanGrade / validAverages.length;
    const averageScore = totalAverageScore / validAverages.length;

    setGpaResult({
      gpa: Math.round(finalGPA * 1000) / 1000,
      azerbaijanGrade: Math.round(finalAzerbaijanGrade * 10) / 10,
      totalPeriods: validAverages.length,
      averageScore: Math.round(averageScore * 100) / 100,
      letterGrade: getLetterGrade(finalGPA),
    });
  };

  const saveInputState = async () => {
    if (isInitialLoad) return;

    const hasData =
      semesterAverages.some((avg) => avg.period || avg.average) ||
      yearlyAverages.some((avg) => avg.period || avg.average);

    if (!hasData) return;

    setInputSaving(true);
    try {
      await apiClient.post('/gpa/input-state/', {
        active_tab: activeTab,
        semester_data: semesterAverages,
        yearly_data: yearlyAverages,
      });
    } catch (error: any) {
      console.error('Error saving input state:', error);
    } finally {
      setInputSaving(false);
    }
  };

  const saveGPA = async () => {
    if (isInitialLoad || !gpaResult || gpaResult.totalPeriods === 0) {
      return;
    }

    if (gpaResult.gpa < 0 || gpaResult.gpa > 4.0) {
      console.error('Invalid GPA value:', gpaResult.gpa);
      return;
    }

    const currentAverages = activeTab === 'semester' ? semesterAverages : yearlyAverages;

    const validAverages = currentAverages.filter(
      (avg) => avg.period && avg.period.trim() && avg.average && avg.average.trim(),
    );

    if (validAverages.length === 0) {
      return;
    }

    setGpaSaving(true);
    try {
      const gpaValue = parseFloat(gpaResult.gpa.toFixed(3));

      const response = await apiClient.post('/gpa/update-user-gpa/', {
        gpa: gpaValue,
        period_type: activeTab,
        period_averages: validAverages.map((avg) => ({
          period: avg.period,
          average: parseFloat(avg.average),
          grade_type: avg.gradeType,
        })),
      });
      console.log('GPA saved successfully:', response.data);
    } catch (error: any) {
      console.error('Error saving GPA:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Request payload:', {
        gpa: gpaResult.gpa,
        period_type: activeTab,
        period_averages: currentAverages,
      });

      if (error.response?.status >= 400 && error.response?.status < 500) {
        const errorMessage =
          error.response?.data?.detail ||
          error.response?.data?.gpa?.[0] ||
          error.response?.data?.error ||
          'Failed to save GPA. Please check the value.';
        showError(errorMessage);
      }
    } finally {
      setGpaSaving(false);
    }
  };

  const handleTabChange = (tab: 'semester' | 'yearly' | 'history') => {
    setActiveTab(tab);
    if (!isInitialLoad) {
      saveInputState();
    }
  };

  const addAverage = () => {
    const currentAverages = activeTab === 'semester' ? semesterAverages : yearlyAverages;
    const newPeriod =
      activeTab === 'semester'
        ? `Semester ${currentAverages.length + 1}`
        : `Year ${currentAverages.length + 1}`;

    const newAverage: GPAAverage = {
      id: Date.now(),
      period: newPeriod,
      average: '',
      gradeType: 'ufaz',
    };

    if (activeTab === 'semester') {
      setSemesterAverages([...semesterAverages, newAverage]);
    } else {
      setYearlyAverages([...yearlyAverages, newAverage]);
    }
  };

  const removeAverage = (id: number) => {
    const currentAverages = activeTab === 'semester' ? semesterAverages : yearlyAverages;
    if (currentAverages.length <= 1) {
      showError('You must have at least one average entry');
      return;
    }

    if (activeTab === 'semester') {
      setSemesterAverages(semesterAverages.filter((avg) => avg.id !== id));
    } else {
      setYearlyAverages(yearlyAverages.filter((avg) => avg.id !== id));
    }
  };

  const updateAverage = (
    id: number,
    field: keyof GPAAverage,
    value: string | 'ufaz' | 'azerbaijan' | 'gpa',
  ) => {
    const update = (averages: GPAAverage[]) =>
      averages.map((avg) => (avg.id === id ? { ...avg, [field]: value } : avg));

    if (activeTab === 'semester') {
      setSemesterAverages(update(semesterAverages));
    } else {
      setYearlyAverages(update(yearlyAverages));
    }
  };

  const resetCalculator = () => {
    const resetAverages: GPAAverage[] = [
      { id: Date.now(), period: '', average: '', gradeType: 'ufaz' },
    ];

    if (activeTab === 'semester') {
      setSemesterAverages(resetAverages);
    } else {
      setYearlyAverages(resetAverages);
    }

    setGpaResult(null);
  };

  const getPlaceholder = (gradeType: string): string => {
    switch (gradeType) {
      case 'ufaz':
        return '16.5';
      case 'azerbaijan':
        return '85';
      case 'gpa':
        return '3.5';
      default:
        return '0';
    }
  };

  const getAverageLabel = (gradeType: string): string => {
    switch (gradeType) {
      case 'ufaz':
        return 'Average (0-20)';
      case 'azerbaijan':
        return 'Average (0-100)';
      case 'gpa':
        return 'Average (0-4.0)';
      default:
        return 'Average';
    }
  };

  const getMinMaxStep = (gradeType: string): { min: number; max: number; step: string } => {
    switch (gradeType) {
      case 'ufaz':
        return { min: 0, max: 20, step: '0.1' };
      case 'azerbaijan':
        return { min: 0, max: 100, step: '1' };
      case 'gpa':
        return { min: 0, max: 4.0, step: '0.01' };
      default:
        return { min: 0, max: 100, step: '1' };
    }
  };

  const currentAverages = activeTab === 'semester' ? semesterAverages : yearlyAverages;
  const status = gpaResult ? getGPAStatus(gpaResult.gpa) : null;

  const renderConversionModal = () => (
    <Modal
      visible={showConversionModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowConversionModal(false)}
    >
      <View style={styles.modalOverlay}>
        <Card style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>UFAZ Grade Scale</Text>
            <TouchableOpacity onPress={() => setShowConversionModal(false)}>
              <Ionicons name="close" size={24} color={c.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.conversionTable}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1 }]}>
                UFAZ Range
              </Text>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1 }]}>Status</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1 }]}>Letter</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1 }]}>GPA</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 1.2 }]}>
                Azerbaijan
              </Text>
            </View>
            {ufazConversionTable.map((entry, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 1 }]}>
                  {entry.min} - {entry.max}
                </Text>
                <Badge
                  label={entry.status}
                  variant={
                    entry.status === 'Perfect' || entry.status === 'Excellent'
                      ? 'success'
                      : entry.status === 'Good'
                        ? 'primary'
                        : entry.status === 'Enough'
                          ? 'warning'
                          : 'error'
                  }
                  style={[styles.tableCell, { flex: 1 }]}
                />
                <Text style={[styles.tableCell, { flex: 1 }]}>{entry.letter}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{entry.gpa}</Text>
                <Text style={[styles.tableCell, { flex: 1.2 }]}>
                  {entry.azMin} - {entry.azMax}
                </Text>
              </View>
            ))}
          </ScrollView>
        </Card>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.screenTitle}>GPA Calculator</Text>
        <View style={styles.tabs}>
          {[
            { key: 'semester' as const, label: 'Semester' },
            { key: 'yearly' as const, label: 'Yearly' },
            { key: 'history' as const, label: 'Stats' },
          ].map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => handleTabChange(t.key)}
              style={[styles.tab, activeTab === t.key && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {activeTab !== 'history' && (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadInputState}
              tintColor={c.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          <Card style={styles.headerCard}>
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <Text style={styles.title}>GPA Calculator</Text>
                <Text style={styles.subtitle}>
                  {activeTab === 'semester' ? 'Semester-based' : 'Yearly Average'} calculations
                </Text>
              </View>
              <View style={styles.headerRight}>
                {(inputSaving || gpaSaving) && (
                  <View style={styles.savingIndicator}>
                    <ActivityIndicator size="small" color={inputSaving ? c.success : c.primary} />
                    <Text style={styles.savingText}>
                      {inputSaving ? 'Saving inputs...' : 'Saving GPA...'}
                    </Text>
                  </View>
                )}
                <TouchableOpacity onPress={resetCalculator} style={styles.resetButton}>
                  <Ionicons name="refresh" size={20} color={c.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowConversionModal(true)}
                  style={styles.scaleButton}
                >
                  <Ionicons name="information-circle" size={20} color={c.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </Card>

          {gpaResult && (
            <Card style={styles.resultsCard}>
              <Text style={styles.resultsTitle}>GPA Results</Text>
              <View style={styles.gpaDisplay}>
                <Text style={styles.gpaValue}>{gpaResult.gpa.toFixed(3)}</Text>
                {status && (
                  <Badge
                    label={status.label}
                    variant={
                      status.label === 'Excellent'
                        ? 'success'
                        : status.label === 'Good'
                          ? 'primary'
                          : status.label === 'Satisfactory'
                            ? 'warning'
                            : 'error'
                    }
                    style={[styles.statusBadge, { backgroundColor: status.bgColor }]}
                    textStyle={{ color: status.color }}
                  />
                )}
                <Text style={styles.letterGrade}>Letter Grade: {gpaResult.letterGrade}</Text>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Overall GPA</Text>
                  <Text style={styles.statValue}>{gpaResult.gpa.toFixed(3)}/4.0</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Azerbaijan Scale</Text>
                  <Text style={[styles.statValue, { color: c.success }]}>
                    {gpaResult.azerbaijanGrade}/100
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Total Periods</Text>
                  <Text style={styles.statValue}>{gpaResult.totalPeriods}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Average Score</Text>
                  <Text style={styles.statValue}>{gpaResult.averageScore.toFixed(2)}</Text>
                </View>
              </View>

              {user?.gpa != null &&
                typeof user.gpa === 'number' &&
                !isNaN(user.gpa) &&
                Math.abs(user.gpa - gpaResult.gpa) > 0.01 && (
                  <Card style={styles.comparisonCard}>
                    <Text style={styles.comparisonText}>
                      Current GPA: {user.gpa.toFixed(3)} → New GPA: {gpaResult.gpa.toFixed(3)}
                    </Text>
                    {gpaResult.gpa > user.gpa && (
                      <Ionicons name="arrow-up" size={20} color={c.success} />
                    )}
                    {gpaResult.gpa < user.gpa && (
                      <Ionicons name="arrow-down" size={20} color={c.error} />
                    )}
                  </Card>
                )}
            </Card>
          )}

          <Card style={styles.averagesCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {activeTab === 'semester' ? 'Semester' : 'Yearly'} Averages
              </Text>
              <TouchableOpacity onPress={addAverage} style={styles.addButton}>
                <Ionicons name="add-circle" size={24} color={c.primary} />
              </TouchableOpacity>
            </View>

            {currentAverages.map((average, index) => {
              const { min, max } = getMinMaxStep(average.gradeType);
              return (
                <Card key={average.id} style={styles.averageRow}>
                  <View style={styles.averageRowHeader}>
                    <Text style={styles.averageNumber}>#{index + 1}</Text>
                    {currentAverages.length > 1 && (
                      <TouchableOpacity
                        onPress={() => removeAverage(average.id)}
                        style={styles.removeButton}
                      >
                        <Ionicons name="trash" size={20} color={c.error} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <Input
                    label={activeTab === 'semester' ? 'Semester' : 'Year'}
                    placeholder={activeTab === 'semester' ? 'e.g., Semester 1' : 'e.g., Year 1'}
                    value={average.period}
                    onChangeText={(text) => updateAverage(average.id, 'period', text)}
                    style={styles.input}
                  />

                  <Picker
                    label="Grade System"
                    value={average.gradeType}
                    options={[
                      { label: 'UFAZ (20-point)', value: 'ufaz' },
                      { label: 'Azerbaijan (100-point)', value: 'azerbaijan' },
                      { label: 'Direct GPA (4.0)', value: 'gpa' },
                    ]}
                    onValueChange={(value) =>
                      updateAverage(average.id, 'gradeType', value as 'ufaz' | 'azerbaijan' | 'gpa')
                    }
                    style={styles.input}
                  />

                  <Input
                    label={getAverageLabel(average.gradeType)}
                    placeholder={getPlaceholder(average.gradeType)}
                    value={average.average}
                    onChangeText={(text) => {
                      const num = parseFloat(text);
                      if (text === '' || (!isNaN(num) && num >= min && num <= max)) {
                        updateAverage(average.id, 'average', text);
                      }
                    }}
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                </Card>
              );
            })}

            <TouchableOpacity onPress={addAverage} style={styles.addAverageButton}>
              <Ionicons name="add" size={20} color={c.primary} />
              <Text style={styles.addAverageText}>
                Add {activeTab === 'semester' ? 'Semester' : 'Year'}
              </Text>
            </TouchableOpacity>
          </Card>
        </ScrollView>
      )}

      {activeTab === 'history' && (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={loadStatistics}
              tintColor={c.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          {statistics && (
            <View style={styles.statsContainer}>
              <Card style={[styles.statCard, styles.statCardGreen]}>
                <Ionicons name="trophy" size={32} color={c.success} />
                <Text style={styles.statCardValue}>
                  {statistics.highest_gpa?.toFixed(3) || '0.000'}
                </Text>
                <Text style={styles.statCardLabel}>Highest GPA</Text>
              </Card>

              <Card style={[styles.statCard, styles.statCardBlue]}>
                <Ionicons name="bar-chart" size={32} color={c.primary} />
                <Text style={styles.statCardValue}>
                  {statistics.average_gpa?.toFixed(3) || '0.000'}
                </Text>
                <Text style={styles.statCardLabel}>Average GPA</Text>
              </Card>

              <Card style={[styles.statCard, styles.statCardPurple]}>
                <Ionicons name="calculator" size={32} color={c.purple} />
                <Text style={styles.statCardValue}>
                  {statistics.total_calculations || statistics.total_periods || 0}
                </Text>
                <Text style={styles.statCardLabel}>Total Calculations</Text>
              </Card>
            </View>
          )}

          <Card style={styles.calculationsCard}>
            <Text style={styles.calculationsTitle}>Saved Calculations</Text>
            {savedCalculations.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No saved calculations yet</Text>
              </View>
            ) : (
              savedCalculations.map((calc) => (
                <Card key={calc.id} style={styles.calculationItem}>
                  <View style={styles.calculationHeader}>
                    <View>
                      <Text style={styles.calculationName}>{calc.name}</Text>
                      <Text style={styles.calculationType}>
                        {calc.type} • {calc.period_count} periods
                      </Text>
                    </View>
                    <Text style={styles.calculationGPA}>{calc.overall_gpa.toFixed(3)}</Text>
                  </View>
                </Card>
              ))
            )}
          </Card>
        </ScrollView>
      )}

      {renderConversionModal()}

      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={hideToast} />
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    headerBar: {
      backgroundColor: c.card,
      paddingHorizontal: 20,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
    },
    screenTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: c.text,
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
      paddingHorizontal: 16,
      borderRadius: RadiusFull,
    },
    tabActive: {
      backgroundColor: c.primaryTint,
    },
    tabText: {
      fontSize: 13,
      color: c.textSecondary,
      fontWeight: '600',
    },
    tabTextActive: {
      color: c.primary,
    },
    scrollView: {
      flex: 1,
    },
    headerCard: {
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 8,
      padding: 16,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    headerLeft: {
      flex: 1,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    savingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    savingText: {
      fontSize: 11,
      color: c.textTertiary,
    },
    resetButton: {
      padding: 6,
    },
    scaleButton: {
      padding: 6,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: c.text,
      marginBottom: 3,
      letterSpacing: -0.2,
    },
    subtitle: {
      fontSize: 13,
      color: c.textSecondary,
    },
    resultsCard: {
      marginHorizontal: 16,
      marginBottom: 12,
      padding: 20,
    },
    resultsTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: c.textSecondary,
      marginBottom: 12,
      textAlign: 'center',
      letterSpacing: 0.1,
    },
    gpaDisplay: {
      alignItems: 'center',
      marginBottom: 16,
    },
    gpaValue: {
      fontSize: 44,
      fontWeight: '700',
      color: c.primary,
      marginBottom: 8,
      letterSpacing: -1,
    },
    statusBadge: {
      marginBottom: 6,
      paddingHorizontal: 14,
      paddingVertical: 4,
    },
    letterGrade: {
      fontSize: 15,
      fontWeight: '600',
      color: c.textSecondary,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 12,
    },
    statBox: {
      flex: 1,
      minWidth: '45%',
      padding: 12,
      backgroundColor: c.subtle,
      borderRadius: RadiusMedium,
      alignItems: 'center',
    },
    statLabel: {
      fontSize: 11,
      color: c.textSecondary,
      marginBottom: 3,
      fontWeight: '500',
    },
    statValue: {
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
    },
    comparisonCard: {
      marginTop: 14,
      padding: 12,
      backgroundColor: c.warningTint,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    comparisonText: {
      fontSize: 13,
      color: c.text,
      fontWeight: '600',
    },
    averagesCard: {
      margin: 16,
      marginTop: 4,
      padding: 20,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
      letterSpacing: -0.1,
    },
    addButton: {
      padding: 4,
    },
    averageRow: {
      marginBottom: 12,
      padding: 14,
      backgroundColor: c.subtle,
      borderWidth: 0,
    },
    averageRowHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    averageNumber: {
      fontSize: 14,
      fontWeight: '700',
      color: c.textSecondary,
    },
    removeButton: {
      padding: 4,
    },
    input: {
      marginBottom: 10,
    },
    addAverageButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: c.border,
      borderRadius: RadiusMedium,
      gap: 6,
      marginTop: 4,
    },
    addAverageText: {
      fontSize: 14,
      fontWeight: '600',
      color: c.primary,
    },
    statsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 16,
      gap: 10,
    },
    statCard: {
      flex: 1,
      minWidth: '45%',
      padding: 18,
      alignItems: 'center',
    },
    statCardGreen: {
      backgroundColor: c.successTint,
    },
    statCardBlue: {
      backgroundColor: c.primaryTint,
    },
    statCardPurple: {
      backgroundColor: c.purpleTint,
    },
    statCardValue: {
      fontSize: 28,
      fontWeight: '700',
      color: c.text,
      marginTop: 8,
      marginBottom: 3,
    },
    statCardLabel: {
      fontSize: 13,
      color: c.textSecondary,
      fontWeight: '500',
    },
    calculationsCard: {
      margin: 16,
      padding: 20,
    },
    calculationsTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
      marginBottom: 14,
      letterSpacing: -0.1,
    },
    calculationItem: {
      marginBottom: 10,
      padding: 14,
      backgroundColor: c.subtle,
      borderWidth: 0,
    },
    calculationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    calculationName: {
      fontSize: 15,
      fontWeight: '600',
      color: c.text,
      marginBottom: 3,
    },
    calculationType: {
      fontSize: 12,
      color: c.textSecondary,
    },
    calculationGPA: {
      fontSize: 22,
      fontWeight: '700',
      color: c.primary,
    },
    emptyState: {
      padding: 32,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: c.textSecondary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: c.overlay,
      justifyContent: 'flex-end',
    },
    modalContent: {
      maxHeight: '80%',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: c.text,
    },
    conversionTable: {
      padding: 16,
    },
    tableHeader: {
      flexDirection: 'row',
      paddingBottom: 10,
      borderBottomWidth: 1.5,
      borderBottomColor: c.border,
      marginBottom: 6,
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
    },
    tableCell: {
      fontSize: 12,
      color: c.text,
      paddingHorizontal: 4,
    },
    tableHeaderText: {
      fontWeight: '600',
      color: c.textSecondary,
      fontSize: 11,
    },
  });
