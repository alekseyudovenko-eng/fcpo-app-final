import React, { useState, useEffect, useCallback } from 'react';
import type { PriceData, Timeframe, ComparisonOption, GroundingSource } from './types';
import { fetchRealtimePriceData, fetchComparisonData } from './services/priceService';
import DashboardHeader from './components/DashboardHeader';
import TimeframeSelector from './components/TimeframeSelector';
import ComparisonSelector from './components/ComparisonSelector';
import PriceChart from './components/PriceChart';
import ChartControls from './components/ChartControls';
import { TIMEFRAMES, COMPARISON_OPTIONS } from './constants';

const MIN_CANDLES_VISIBLE = 5;

const App: React.FC = () => {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [visibleRange, setVisibleRange] = useState({ startIndex: 0, endIndex: 0 });
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('1M');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPriceInfo, setCurrentPriceInfo] = useState({ price: 0, change: 0, changePercent: 0 });
  const [error, setError] = useState<string | null>(null);
  const [comparisonOption, setComparisonOption] = useState<ComparisonOption>('NONE');
  const [comparisonData, setComparisonData] = useState<PriceData[] | null>(null);
  const [isComparisonLoading, setIsComparisonLoading] = useState<boolean>(false);

  // Твоя функция теперь внутри компонента:
  const fetchData = useCallback(async (timeframe: Timeframe) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, sources: newSources } = await fetchRealtimePriceData(timeframe);
      setPriceData(data);
      setSources(newSources);
      
      if (data && data.length > 0) {
        setVisibleRange({ startIndex: 0, endIndex: data.length });
        const latestData = data[data.length - 1];
        const previousData = data.length > 1 ? data[data.length - 2] : latestData;
        const change = latestData.close - previousData.close;
        const changePercent = previousData.close !== 0 ? (change / previousData.close) * 100 : 0;
        
        setCurrentPriceInfo({
          price: latestData.close,
          change: change,
          changePercent: changePercent,
        });
      } else {
        setVisibleRange({ startIndex: 0, endIndex: 0 });
        setError('No recent price data found.');
      }
    } catch (err) {
      setError('Failed to fetch real-time price data.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeTimeframe);
  }, [activeTimeframe, fetchData]);

  useEffect(() => {
    if (comparisonOption === 'NONE' || priceData.length === 0) {
      setComparisonData(null);
      return;
    }
    const loadComp = async () => {
      setIsComparisonLoading(true);
      try {
        const data = await fetchComparisonData(activeTimeframe, comparisonOption, priceData);
        setComparisonData(data);
      } catch (e) { console.error(e); }
      finally { setIsComparisonLoading(false); }
    };
    loadComp();
  }, [comparisonOption, priceData, activeTimeframe]);

  const visibleData = priceData.slice(visibleRange.startIndex, visibleRange.endIndex).map(p => ({
    ...p,
    comparisonClose: comparisonData?.find(c => c.date === p.date)?.close
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader priceInfo={currentPriceInfo} isLoading={isLoading} onRefresh={() => fetchData(activeTimeframe)} />
        <main className="mt-6 bg-white rounded-xl shadow p-6">
          <div className="flex justify-between mb-6">
            <TimeframeSelector timeframes={TIMEFRAMES} activeTimeframe={activeTimeframe} onSelect={setActiveTimeframe} />
            <ComparisonSelector options={COMPARISON_OPTIONS} activeOption={comparisonOption} onSelect={setComparisonOption} />
          </div>
          <div className="h-[400px]">
            {isLoading ? <div className="h-full flex items-center justify-center">Loading...</div> : 
             error ? <div className="text-red-500">{error}</div> :
             <PriceChart data={visibleData} comparisonLabel={comparisonOption} />}
          </div>
        </main>
      </div>
    </div>
  );
};

// ВОТ ЭТА СТРОЧКА СПАСЕТ БИЛД:
export default App;
