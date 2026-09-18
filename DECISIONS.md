<style>
  table {
    border-collapse: collapse;
    width: 100%;
    table-layout: fixed; /* Keeps column sizes static */
  }
  th, td {
    border: 1px solid #ccc; /* Thin line between rows and columns */
    padding: 8px;
    word-wrap: break-word; /* Forces long text to wrap to the next line */
    overflow-wrap: break-word;
    text-align: left;
    vertical-align: top;
  }
</style>
<table>
  <colgroup>
    <col style="width: 20%;">
    <col style="width: 20%;">
    <col style="width: 20%;">
    <col style="width: 20%;">
    <col style="width: 20%;">
  </colgroup>
  <thead>
    <tr>
      <th>Decision</th>
      <th>Rejected</th>
      <th>Cost</th>
      <th>Falsifier</th>
      <th>When Decision was taken</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Simplistic Auth system. pre-determined users, scoped to specific plants</td>
      <td>Signup system, plant assignment, scoped roles, accounts view for crews</td>
      <td>No way to add a new user without manually adding them to the database</td>
      <td>Admin roles. User managment requirments</td>
      <td>Planing</td>
    </tr>
  </tbody>
  <tbody>
    <tr>
      <td>Crew are only able to service certain Plants depending on the region</td>
      <td>Global service to every plant by every crew</td>
      <td>Need to implement mapping and add logic regarding it to backend</td>
      <td>Explicit requirment that every crew can service any field</td>
      <td>Planing</td>
    </tr>
  </tbody>
  <tbody>
    <tr>
      <td>Crew cleaning, takes `plant.capcity_mw / worker.mw_per_day` days. Cleaing is not instant</td>
      <td>Cleaning is done within one day</td>
      <td>Need to consider this into a formula for the possible_return when calculating</td>
      <td>Scope and requirment change</td>
      <td>Planing</td>
    </tr>
  </tbody>
  <tbody>
    <tr>
      <td>Cost of cleaning = `plant.cleaning_cost` + `days * worker.rate_usd_day`</td>
      <td>Cost of cleaning is as given in the formula</td>
      <td>Need to factor in this into the formula</td>
      <td>Change in how data/models are represented</td>
      <td>Planing</td>
    </tr>
  </tbody>
  <tbody>
    <tr>
      <td>
        Pre-compute read data needed for the main dashboard to avoid 8am spikes using up all of the api capacity
      </td>
      <td>Compute read requests upon getting the request</td>
      <td>
        Works great if data stays consistent overnight. Data change should invalidate the cache and queue background
        workers for re-computing. Gets confusing when worker starts working before the reading starts. Have to handle cache locking and distributed locking
      </td>
      <td>Scope and requirment change</td>
      <td>Planing</td>
    </tr>
  </tbody>
  <tbody>
    <tr>
      <td>Simple background worker using database as broker</td>
      <td>Dedicated celery worker + Redis broker for background tasks</td>
      <td>No-workflow orchestraion or complex tasks. constant db pooling and overhead read/write chrun</td>
      <td>Complex task needed for features. Heavy load on DB and need for multiple workers working on the same task</td>
      <td>Project setup</td>
    </tr>
  </tbody>
  <tbody>
    <tr>
      <td>Database cache using Django DBCache feature with K/V store</td>
      <td>Redis Cache</td>
      <td>Slower read/writes, as DBCache is not an in-memory cache</td>
      <td>If the read/write latency to the cache becomes the bottleneck when building at scale</td>
      <td>Project setup</td>
    </tr>
  </tbody>
  <tbody>
    <tr>
      <td>
        Pre-computation is stored in database, not inside of cache
      </td>
      <td>Storing the overnight pre-computations inside of cache</td>
      <td>
        Reading from database is a bit slower. But still not a bottleneck
      </td>
      <td>If read/write from pre-compute tables become a bottleneck</td>
      <td>Start of implementation</td>
    </tr>
  </tbody>
  <tbody>
    <tr>
      <td>
        Frontend design tokens are a copy of swishsolar.com's own shadcn/ui palette, declared as
        CSS variables in `index.css` and exposed to Tailwind v4 via `@theme inline`, with a
        class-driven `.dark` override
      </td>
      <td>Invent a palette, or install shadcn/ui and take its default theme</td>
      <td>
        The dark values are derived, not observed. the real site has no dark app theme to copy,
        so dark mode is our interpretation of the brand
      </td>
      <td>Swish ships a real SwishOS theme that contradicts it</td>
      <td>Frontend implementation</td>
    </tr>
  </tbody>
  <tbody>
    <tr>
      <td>
        TanStack Query owns all server state (loading/error/refetch/caching);
      </td>
      <td>useEffect + useState per screen, or a global store</td>
      <td>One more dependency, and cache-key discipline once writes are added</td>
      <td>Heavy client-only state, or an offline-first requirement</td>
      <td>Frontend implementation</td>
    </tr>
  </tbody>
  <tbody>
    <tr>
      <td>
        `seed_fleet_data` also (re)creates dev users each run: one `admin`/`solar123`
        superuser owning every plant, plus `round(plant_count * 0.6)` regular users
        (`user1..userN`/`solar123`), the first half (integer floor) owning 2 random
        plants each and the rest owning 1
      </td>
      <td>Leave user provisioning to a separate command, or require manual `createsuperuser`</td>
      <td>Wipes all existing User rows on every run (same tradeoff as the Plant/Crew full-reimport decision above) — not safe if a real operator account needs to survive a reseed</td>
      <td>Real (non-seed) accounts need to persist across reseeds</td>
      <td>Implementation (seed_fleet_data command)</td>
    </tr>
  </tbody>
  <tbody>
    <tr>
      <td>
        Break analytics process into seperate django app, allowing microservice creation in the future
      </td>
      <td>Holding the same logic, api routes and models in the core app</td>
      <td>cross-app dependancy handling, additional setup</td>
      <td>Monolith approach, change in stats of user utilizing it</td>
      <td>Implementation final steps</td>
    </tr>
  </tbody>
  <tbody>
    <tr>
      <td>
        Summary agent: generate summary based on analytics, insights and past history about the current plant, using an LLM
      </td>
      <td>Chat System revolving around LLM, where agent has tool calls and ability to complete complex tasks</td>
      <td>Simplified responses. few insights and context can be gathered from sources given to the LLM </td>
      <td>Complex relationship between the descion to dispatch crew Vs not to</td>
      <td>Implementation final steps</td>
    </tr>
  </tbody>
</table>


## Assumptions
- Rate to table growth is bound by Plant days. Meaning we don't have milions of crews for just 200 plants
- Majority of our users are bound to only one zone, and control at most 3 Plants
- We take the data given to use by random generator as facts. We don't sanity-check them
- 200 Plants by End of the yaer, worst case double the users and plants by next year
- For the time being, we don't have malicious users who have access to our system
