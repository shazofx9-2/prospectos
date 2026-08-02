import { Router, Response } from 'express';
import { DB } from '../db.js';
import { authMiddleware, AuthenticatedRequest } from '../auth.js';

const router = Router();

router.use(authMiddleware);

// GET /api/analytics
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Load user's prospects, clients, tasks, and reminders
    const prospects = DB.query('prospects').filter((p) => p.userId === userId);
    const clients = DB.query('clients').filter((c) => c.userId === userId);
    const reminders = DB.query('reminders').filter((r) => r.userId === userId);

    // Compute basic metrics
    const totalProspects = prospects.length;
    const activeProspects = prospects.filter(
      (p) => !['Landed', 'Failed', 'Archived', 'Not Interested'].includes(p.status)
    ).length;

    const totalClients = clients.length;
    const activeClients = clients.filter((c) => c.status === 'Active').length;

    const landedDeals = prospects.filter((p) => p.status === 'Landed').length;
    const failedDeals = prospects.filter((p) => p.status === 'Failed').length;

    const pendingFollowups = reminders.filter((r) => !r.isCompleted).length;

    // Financial Metrics
    const mrr = clients.reduce((acc, c) => acc + (c.monthlyRetainer || 0), 0);
    const totalUpfront = clients.reduce((acc, c) => acc + (c.contractValue || 0), 0);
    const totalRevenueGenerated = totalUpfront + mrr;
    const totalContractValue = totalUpfront;

    // Rates
    const conversionRate = totalProspects > 0 ? Number(((landedDeals / totalProspects) * 100).toFixed(1)) : 0;
    const totalClosed = landedDeals + failedDeals;
    const winRate = totalClosed > 0 ? Number(((landedDeals / totalClosed) * 100).toFixed(1)) : 0;

    // Retention Rate: (Total Clients - Lost/Cancelled Clients) / Total Clients
    const lostClientsCount = clients.filter((c) => ['Cancelled', 'Lost'].includes(c.status)).length;
    const retentionRate = totalClients > 0
      ? Number((((totalClients - lostClientsCount) / totalClients) * 100).toFixed(1))
      : 100;

    // Pipeline status distribution (Funnel)
    const pipelineFunnel = [
      { name: 'New', value: prospects.filter((p) => p.status === 'New').length },
      { name: 'Contacted', value: prospects.filter((p) => p.status === 'Contacted').length },
      { name: 'Follow Up', value: prospects.filter((p) => p.status === 'Follow Up').length },
      { name: 'Meeting Scheduled', value: prospects.filter((p) => p.status === 'Meeting Scheduled').length },
      { name: 'Proposal Sent', value: prospects.filter((p) => p.status === 'Proposal Sent').length },
      { name: 'Negotiating', value: prospects.filter((p) => p.status === 'Negotiating').length },
      { name: 'Landed', value: landedDeals },
      { name: 'Failed', value: failedDeals },
    ];

    // Source Distribution
    const sourcesMap: Record<string, number> = {};
    prospects.forEach((p) => {
      const src = p.source || 'Unknown';
      sourcesMap[src] = (sourcesMap[src] || 0) + 1;
    });
    const topLeadSources = Object.entries(sourcesMap).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Industry Distribution
    const industriesMap: Record<string, number> = {};
    prospects.forEach((p) => {
      const ind = p.industry || 'Unknown';
      industriesMap[ind] = (industriesMap[ind] || 0) + 1;
    });
    const topIndustries = Object.entries(industriesMap).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Country Distribution
    const countriesMap: Record<string, number> = {};
    prospects.forEach((p) => {
      const c = p.country || 'Unknown';
      countriesMap[c] = (countriesMap[c] || 0) + 1;
    });
    const topCountries = Object.entries(countriesMap).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Monthly Growth (monthly metrics generated from dateAdded to match database)
    // Map dates to month names
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyProspectGrowth = monthNames.map((m, idx) => {
      const count = prospects.filter((p) => {
        const d = new Date(p.dateAdded);
        return d.getMonth() === idx;
      }).length;

      return { name: m, prospects: count };
    });

    const monthlyRevenueTrend = monthNames.map((m, idx) => {
      // Clients who started in this specific month provide upfront
      const startedThisMonth = clients.filter((c) => {
        if (!c.startDate) return false;
        const d = new Date(c.startDate);
        return d.getMonth() === idx;
      });

      // Active clients up to or in this month provide retainers
      const activeUpToThisMonth = clients.filter((c) => {
        if (!c.startDate) return false;
        const d = new Date(c.startDate);
        return d.getMonth() <= idx;
      });

      const upfront = startedThisMonth.reduce((sum, c) => sum + (c.contractValue || 0), 0);
      const retainers = activeUpToThisMonth.reduce((sum, c) => sum + (c.monthlyRetainer || 0), 0);
      const totalMonthRevenue = upfront + retainers;

      return {
        name: m,
        revenue: Math.round(totalMonthRevenue),
        upfront: Math.round(upfront),
        retainers: Math.round(retainers)
      };
    });

    res.json({
      metrics: {
        totalProspects,
        activeProspects,
        totalClients,
        activeClients,
        landedDeals,
        failedDeals,
        pendingFollowups,
        mrr,
        totalUpfront,
        totalRevenueGenerated,
        totalContractValue,
        conversionRate,
        winRate,
        retentionRate,
      },
      charts: {
        pipelineFunnel,
        topLeadSources,
        topIndustries,
        topCountries,
        monthlyProspectGrowth,
        monthlyRevenueTrend,
        wonVsLost: [
          { name: 'Won (Landed)', value: landedDeals },
          { name: 'Lost (Failed)', value: failedDeals },
        ],
      },
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error generating analytics' });
  }
});

export default router;
