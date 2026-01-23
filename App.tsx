const fetchData = useCallback(async (timeframe: Timeframe) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, sources } = await fetchRealtimePriceData(timeframe);
      setPriceData(data);
      setSources(sources);
      
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
        setError('No recent price data found for the selected timeframe.');
      }
    } catch (err) {
      setError('Failed to fetch real-time price data.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);
